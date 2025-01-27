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
            let res = await this.account.createEmailPasswordSession(
                email,
                password
            );
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
            if (!this.account) {
                this.account = new Account(this.client);
            }
            await this.account.createMagicURLToken(
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
            const name = email.split('@')[0];
            await this.account.create(ID.unique(), email, password, name);
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
    async createFeed(url, addFeedFail, setLoading) {
        setLoading(true);
        if (!url) {
            addFeedFail();
            setLoading(false);
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
            setLoading(false);
            return null;
        }
        if (feed == null) {
            addFeedFail();
            setLoading(false);
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
            setLoading(false);
            return { ...feed, id: id };
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
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
    async getArticleSources(fetchFeedsFail) {
        const sources = await this.getFeeds();
        const ids = new Map();
        sources.forEach((source) => {
            if (source?.url && source?.$id) ids.set(source.url, source.$id);
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
            const articleSources = JSON.parse(res.responseBody).data;
            const feeds = [];
            const failedFeeds = [];
            for (const source of articleSources) {
                if (source?.status != 200 && source?.data?.url) {
                    console.error(source.message);
                    failedFeeds.push(source.data.url);
                    continue;
                }
                if (
                    source?.data?.url &&
                    source?.data?.title &&
                    source?.data?.articles
                ) {
                    feeds.push({
                        id: ids.get(source.data.url),
                        title: source.data.title,
                        url: source.data.url,
                        items: source.data.articles,
                    });
                }
            }
            if (fetchFeedsFail && failedFeeds.length > 0) {
                fetchFeedsFail(failedFeeds.join('\n'));
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
    async getArticle(url, title, author, pubDate, setRawText) {
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
            let url_origin = new URL(url).origin;
            let flex_dir =
                window.innerWidth > window.innerHeight ? 'row' : 'column';
            let width = Math.min(screen.width, window.innerWidth);
            let content = [
                <a
                    href={url}
                    target="_blank"
                    style={{
                        color: 'blue',
                        textDecoration: 'underline',
                        display: 'block',
                        width: '90%',
                        margin: 'auto',
                    }}
                >
                    View original article
                </a>,
                <br />,
                <div
                    style={{
                        display: 'flex',
                        flexDirection: flex_dir,
                        justifyItems: 'center',
                        alignItems: 'center',
                        margin: 'auto',
                        marginTop: '10px',
                        marginBottom: '10px',
                        width: '90%',
                        minWidth: `${Math.max(width * 0.8, 275)}px`,
                    }}
                >
                    <img
                        src={`https://www.google.com/s2/favicons?sz=64&domain=${url_origin}`}
                        width="48px"
                        height="48px"
                        style={{
                            alignSelf: 'center',
                        }}
                    />
                    <h1
                        style={{
                            textAlign: 'center',
                            width: 'calc(100% - 64px)',
                            marginTop: '10px',
                        }}
                    >
                        {title}
                    </h1>
                </div>,
                author ? (
                    <h3 style={{ margin: 'auto', width: '70%' }}>{author}</h3>
                ) : null,
                <h3 style={{ margin: 'auto', width: '70%' }}>
                    {new Date(pubDate).toLocaleString()}
                </h3>,
                <br />,
            ];
            let rawText = '';
            for (let tag of article.tags) {
                rawText += tag + '\n';
                content.push(
                    <p
                        style={{
                            width: '70%',
                            minWidth: `${Math.max(width * 0.7, 275)}px`,
                            margin: 'auto',
                        }}
                    >
                        {tag}
                    </p>
                );
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

    async recordArticleRead(article, id) {
        let rankingUser = false;
        try {
            let res = await this.database.listDocuments(
                APPWRITE_CONFIG.USERS_DB,
                APPWRITE_CONFIG.RANKING_USERS,
                [Query.equal('user_id', this.uid)]
            );
            rankingUser = res.documents.length > 0;
        } catch {
            rankingUser = false;
        }
        if (rankingUser) {
            try {
                await this.database.createDocument(
                    APPWRITE_CONFIG.FEEDS_DB,
                    APPWRITE_CONFIG.READ_ARTICLES,
                    ID.unique(),
                    {
                        user_id: this.uid,
                        title: article.title,
                        url: article.link,
                    }
                );
            } catch (err) {
                console.error(err);
            }
        }
    }
    /**
     * Retrieves the user's podcasts.
     * @returns {Array<Object>|null} The user's podcasts, or null if an error occurs.
     */
    async getPodcasts(errorToast) {
        let podcasts = [];
        try {
            const res = await this.database.listDocuments(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.PODCASTS,
                [Query.equal('user_id', this.uid)]
            );
            podcasts = res.documents;
        } catch (err) {
            console.error(err);
            return null;
        }

        const ids = new Map();
        podcasts.forEach((source) => {
            ids.set(source.url, source.$id);
        });
        let urls = podcasts.map((source) => source.url);

        try {
            const feeds = [];
            let podcastSources;
            let failedPodcasts = [];
            let res;
            for (let i = 0; i < 2; i++) {
                res = await this.functions.createExecution(
                    APPWRITE_CONFIG.FETCH_ARTICLES,
                    JSON.stringify({ type: 'podcast', urls: urls }),
                    false,
                    '/',
                    'GET'
                );
                podcastSources = JSON.parse(res.responseBody).data;
                failedPodcasts = [];
                for (const source of podcastSources) {
                    if (source.status != 200) {
                        console.error(source);
                        failedPodcasts.push(source.data.url);
                        continue;
                    }
                    feeds.push({
                        id: ids.get(source.data.url),
                        title: source.data.title,
                        episodes: source.data.episodes,
                    });
                }
                if (failedPodcasts.length == 0) {
                    break;
                } else if (i == 0) {
                    errorToast('Failed to fetch some podcasts... Retrying');
                }
                urls = failedPodcasts.copyWithin();
            }
            if (errorToast && failedPodcasts.length > 0) {
                errorToast(
                    `Failed to fetch podcasts:\n${failedPodcasts.join('\n')}`
                );
            }
            return feeds;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    async createPodcast(url, addPodcastFail, setLoading) {
        setLoading(true);
        if (!url) {
            addPodcastFail(`Failed to add podcast from ${url}`);
            setLoading(false);
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
                JSON.stringify({ type: 'podcast', urls: [url] }),
                false,
                '/',
                'GET'
            );
            let podcastSource = JSON.parse(res.responseBody);
            podcastSource = podcastSource.data[0];
            let episodes = [];
            if (
                podcastSource.data.episodes &&
                Array.isArray(podcastSource.data.episodes[0])
            ) {
                for (let episodeList of podcastSource.data.episodes) {
                    episodes = episodes.concat(episodeList);
                }
            } else {
                episodes = podcastSource.data.episodes;
            }
            feed = {
                title: podcastSource.data.title,
                episodes: episodes,
            };
        } catch (err) {
            console.error(err);
            addPodcastFail(`Failed to add podcast from ${url}`);
            setLoading(false);
            return null;
        }
        if (feed == null) {
            addPodcastFail(`Failed to add podcast from ${url}`);
            setLoading(false);
            return null;
        }

        try {
            let id = ID.unique();
            await this.database.createDocument(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.PODCASTS,
                id,
                { url: url, user_id: this.uid },
                [
                    Permission.read(Role.user(this.uid)),
                    Permission.write(Role.user(this.uid)),
                    Permission.update(Role.user(this.uid)),
                    Permission.delete(Role.user(this.uid)),
                ]
            );
            setLoading(false);
            return { ...feed, id: id };
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    /**
     * Deletes a podcast from the database.
     * @param {string} id - The ID of the podcast to delete.
     */
    async deletePodcast(id) {
        try {
            await this.database.deleteDocument(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.PODCASTS,
                id
            );
        } catch (err) {
            console.error(err);
        }
    }

    async searchPodcasts(query) {
        let podcasts = [];
        try {
            let res = await this.database.listDocuments(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.PODCASTS,
                [Query.contains('url', query), Query.limit(100)]
            );
            for (let podcast of res.documents) {
                let podcast_url = new URL(podcast.url);
                if (
                    !podcasts.includes(
                        podcast_url.hostname + podcast_url.pathname
                    )
                ) {
                    podcasts.push(podcast_url.hostname + podcast_url.pathname);
                }
            }
        } catch (err) {
            console.error(err);
        }
        podcasts.sort();
        return podcasts;
    }

    async setPodcastListenTime(title, time) {
        try {
            await this.functions.createExecution(
                APPWRITE_CONFIG.RECORD_PODCAST_LISTEN_TIME,
                JSON.stringify({
                    title: title,
                    time: time,
                    user_id: this.uid,
                    finished: false,
                }),
                true,
                '/',
                'GET'
            );
        } catch (err) {
            console.error(err);
        }
    }

    async setPodcastFinished(title) {
        try {
            await this.functions.createExecution(
                APPWRITE_CONFIG.RECORD_PODCAST_LISTEN_TIME,
                JSON.stringify({
                    title: title,
                    user_id: this.uid,
                    finished: true,
                }),
                true,
                '/',
                'GET'
            );
        } catch (err) {
            console.error(err);
        }
    }

    async getPodcastListenTime(title) {
        try {
            const res = await this.database.listDocuments(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.LISTEN_TIME,
                [Query.equal('title', title)]
            );
            if (res.documents.length > 0) {
                return res.documents[0].time;
            } else {
                return 0;
            }
        } catch (err) {
            console.error(err);
            return 0;
        }
    }

    async getPodcastListenTimes() {
        try {
            const res = await this.database.listDocuments(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.LISTEN_TIME,
                [Query.equal('user_id', this.uid)]
            );
            return res.documents;
        } catch (err) {
            console.error(err);
            return [];
        }
    }
}
