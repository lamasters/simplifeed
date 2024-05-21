import {
    Account,
    Client,
    Databases,
    Functions,
    ID,
    Permission,
    Query,
    Role,
} from 'appwrite';

import { APPWRITE_CONFIG } from './constants';

/**
 * Represents a logged in user's session
 * Contains methods to interact with the Appwrite API,
 * fetch user data, and manage user feeds.
 * @class
 */
export class UserSession {
    /**
     * Creates a new UserSession object.
     * @constructor
     */
    constructor() {
        this.client = new Client()
            .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
            .setProject(APPWRITE_CONFIG.PROJECT);

        this.account = new Account(this.client);
        this.database = new Databases(this.client);
        this.functions = new Functions(this.client);

        this.uid = null;
        this.sessionInfo = null;
    }

    /**
     * Logs in the user with the provided email and password.
     * @param {string} email - The user's email.
     * @param {string} password - The user's password.
     * @param {object} router - The router object used for navigation.
     * @param {function} setLoading - The hook to set the loading status.
     */
    async login(email, password, router, setLoading, loginFail) {
        setLoading(true);
        try {
            let res = await this.account.createEmailSession(email, password);
            this.sessionInfo = res;
            this.uid = res.$id;
            router.push('/');
        } catch (err) {
            this.uid = null;
            this.sessionInfo = null;
            console.error(err);
            loginFail();
        } finally {
            setLoading(false);
        }
    }

    /**
     * Send an email with a sign in link to the user
     * @param {string} email - The user's email
     */
    async magicUrlLogin(email, sent, failed) {
        try {
            let redirectUrl = `${window.location.protocol}//${window.location.hostname.replace('www.', '')}`;
            if (window.location.port) {
                redirectUrl += `:${window.location.port}`;
            }
            console.debug(redirectUrl);
            await this.account.createMagicURLSession(
                ID.unique(),
                email,
                redirectUrl
            );
            sent();
        } catch (e) {
            console.error(e);
            failed();
        }
    }

    async updateVerification(router, setVerified, setLoading) {
        setLoading(true);
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const secret = urlParams.get('secret');
            const userId = urlParams.get('userId');
            await this.account.updateVerification(userId, secret);
            setVerified(true);
            router.push('/');
        } catch (e) {
            setVerified(false);
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Updates the session using the magic URL parameters.
     */
    async updateMagicUrlSession() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const secret = urlParams.get('secret');
            const userId = urlParams.get('userId');

            const user = await this.account.updateMagicURLSession(
                userId,
                secret
            );
            return user;
        } catch (e) {
            console.error(e);
            return undefined;
        }
    }

    /**
     * Logs out the user by deleting the current session and redirecting to
     * the login page.
     * @param {Object} router - The router object used for navigation.
     */
    async logout(router, logoutFail) {
        try {
            await this.account.deleteSession('current');
            this.sessionInfo = null;
            this.uid = null;
            router.push('/login');
        } catch (err) {
            console.error(err);
            logoutFail();
        }
    }

    /**
     * Registers a user with the provided email and password.
     * @param {string} email - The email of the user.
     * @param {string} password - The password of the user.
     * @param {object} router - The router object.
     * @param {function} setLoading - The hook to set the loading status.
     */
    async register(
        email,
        password,
        router,
        setLoading,
        signupFail,
        loginFailed
    ) {
        setLoading(true);
        try {
            await this.account.create(ID.unique(), email, password);
            await this.login(email, password, router, setLoading, loginFailed);
        } catch (err) {
            console.error(err);
            signupFail();
        } finally {
            setLoading(false);
        }
    }

    /**
     * Retrieves existing user session.
     */
    async getSession() {
        let userSession = { $id: null };
        let verified = false;
        this.uid = null;
        this.sessionInfo = null;
        try {
            userSession = await this.account.getSession('current');
            console.debug('Existing Session');
            this.sessionInfo = userSession;
            this.uid = userSession.userId;
        } catch (err) {
            console.error(err);
        }
        if (!userSession?.$id) {
            try {
                userSession = await this.updateMagicUrlSession();
                console.debug('Magic URL Session');
                this.sessionInfo = userSession;
                this.uid = userSession.userId;
            } catch (e) {
                console.error(e);
            }
        }

        if (userSession?.$id) {
            const account = await this.account.get();
            verified = account?.emailVerification;
            if (!verified) {
                let redirectUrl = `${window.location.protocol}//${window.location.hostname.replace('www.', '')}`;
                if (window.location.port) {
                    redirectUrl += `:${window.location.port}`;
                }
                this.account.createVerification(`${redirectUrl}/verify`);
            }
        }
        return { ...userSession, verified: verified };
    }

    /**
     * Retrieves the feeds for the current user.
     * @returns {Array<Object>|null} The array of feed documents, or null if
     * an error occurs.
     */
    async getFeeds() {
        try {
            let feeds = await this.database.listDocuments(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.NEWS,
                [Query.equal('user_id', this.uid)]
            );

            return feeds.documents;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    /**
     * Creates a feed from the given URL.
     *
     * @param {string} url - The URL of the feed source.
     * @returns {Object|null} - The created feed object, or null if the feed
     * could not be created.
     */
    async createFeed(url, addFeedFail) {
        if (!url) {
            addFeedFail();
            return null;
        }
        if (this.uid === null) {
            await this.getSession();
        }

        let feed = null;
        try {
            // Ensure that the feed can be properly parsed
            let res = await this.functions.createExecution(
                APPWRITE_CONFIG.FETCH_ARTICLES,
                JSON.stringify({ type: 'source', urls: [url] }),
                false,
                '/',
                'GET'
            );
            let articleSource = JSON.parse(res.responseBody);
            articleSource = articleSource.data[0];
            feed = {
                title: articleSource.data.title,
                items: articleSource.data.articles,
            };
        } catch (err) {
            console.error(err);
            addFeedFail();
            return null;
        }
        if (feed == null) {
            addFeedFail();
            return null;
        }

        try {
            let id = ID.unique();
            await this.database.createDocument(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.NEWS,
                id,
                { url: url, user_id: this.uid },
                [
                    Permission.read(Role.user(this.uid)),
                    Permission.write(Role.user(this.uid)),
                    Permission.update(Role.user(this.uid)),
                    Permission.delete(Role.user(this.uid)),
                ]
            );
            return { ...feed, id: id };
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Deletes a feed from the database.
     * @param {string} id - The ID of the feed to delete.
     */
    async deleteFeed(id) {
        try {
            await this.database.deleteDocument(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.NEWS,
                id
            );
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Retrieves the article sources by fetching feeds and creating an execution.
     * @returns {Array<Object>|null} An array of feeds containing the id,
     * title, and items of each source, or null if an error occurs.
     */
    async getArticleSources() {
        const sources = await this.getFeeds();
        const ids = new Map();
        sources.forEach((source) => {
            ids.set(source.url, source.$id);
        });
        const urls = sources.map((source) => source.url);
        if (urls == null) {
            return;
        }

        try {
            let res = await this.functions.createExecution(
                APPWRITE_CONFIG.FETCH_ARTICLES,
                JSON.stringify({ type: 'source', urls: urls }),
                false,
                '/',
                'GET'
            );
            let articleSources = JSON.parse(res.responseBody).data;
            let feeds = [];
            for (let source of articleSources) {
                if (source.status != 200) continue;
                feeds.push({
                    id: ids.get(source.data.url),
                    title: source.data.title,
                    items: source.data.articles,
                });
            }
            return feeds;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    /**
     * Retrieves an article from a given URL and generates HTML content for display.
     * @param {string} url - The URL of the article.
     * @param {string} title - The title of the article.
     * @param {function} setRawText - The hook to set the raw text of the article.
     * @returns {JSX.Element|null} - The generated HTML content for the article, or null if an error occurs.
     */
    async getArticle(url, title, setRawText) {
        try {
            let res = await this.functions.createExecution(
                APPWRITE_CONFIG.FETCH_ARTICLES,
                JSON.stringify({ type: 'article', urls: [url] }),
                false,
                '/',
                'GET'
            );
            let articles_res = JSON.parse(res.responseBody).data[0];
            if (articles_res.status != 200)
                return (
                    <div>
                        Couldn't parse article.{' '}
                        <a
                            href={url}
                            target="_blank"
                            style={{
                                color: 'blue',
                                textDecoration: 'underline',
                            }}
                        >
                            View original article.
                        </a>
                    </div>
                );
            let article = articles_res.data;
            let content = [
                <a
                    href={url}
                    target="_blank"
                    style={{ color: 'blue', textDecoration: 'underline' }}
                >
                    View original article
                </a>,
                <br />,
                <h1 style={{ textAlign: 'center', margin: '10px' }}>
                    {title}
                </h1>,
                <br />,
            ];
            let rawText = '';
            for (let tag of article.tags) {
                rawText += tag + '\n';
                content.push(<p>{tag}</p>);
                content.push(<br />);
            }
            for (let i = 0; i < 15; i++) {
                content.push(<br />);
            }
            setRawText(rawText);

            return <div>{content}</div>;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    /**
     * Checks if the user has access to AI features.
     * @param {function} setProUser - The hook to set the pro user status.
     */
    async checkProUser(setProUser) {
        try {
            let res = await this.database.listDocuments(
                APPWRITE_CONFIG.USERS_DB,
                APPWRITE_CONFIG.PRO_USERS,
                [Query.equal('user_id', this.uid)]
            );
            if (res.documents.length > 0) {
                setProUser(true);
            } else {
                setProUser(false);
            }
        } catch (e) {
            setProUser(false);
            console.error(e);
        }
    }

    /**
     * Retrieves the AI summary of an article.
     * @param {string} article - The article to retrieve the summary for.
     */
    async getSummary(article) {
        try {
            let res = await this.functions.createExecution(
                APPWRITE_CONFIG.SUMMARIZE_ARTICLE,
                JSON.stringify({ user_id: this.uid, article: article }),
                false,
                '/',
                'GET'
            );
            return JSON.parse(res.responseBody).summary;
        } catch (err) {
            console.error(err);
        }

        return '';
    }

    async searchFeeds(query) {
        let feeds = [];
        try {
            let res = await this.database.listDocuments(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.NEWS,
                [Query.contains('url', query), Query.limit(100)]
            );
            for (let feed of res.documents) {
                let feed_url = new URL(feed.url);
                if (!feeds.includes(feed_url.hostname + feed_url.pathname)) {
                    feeds.push(feed_url.hostname + feed_url.pathname);
                }
            }
        } catch (err) {
            console.error(err);
        }
        feeds.sort();
        return feeds;
    }
}
