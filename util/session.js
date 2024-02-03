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
     */
    async login(email, password, router) {
        try {
            let res = await this.account.createEmailSession(email, password);
            this.sessionInfo = res;
            this.uid = res.$id;
            router.push('/');
        } catch (err) {
            this.uid = null;
            this.sessionInfo = null;
            console.error(err);
            alert('Login failed');
        }
    }

    /**
     * Logs out the user by deleting the current session and redirecting to
     * the login page.
     * @param {Object} router - The router object used for navigation.
     */
    async logout(router) {
        try {
            await this.account.deleteSession('current');
            this.sessionInfo = null;
            this.uid = null;
            router.push('/login');
        } catch (err) {
            console.error(err);
            alert('Logout failed');
        }
    }

    /**
     * Registers a user with the provided email and password.
     * @param {string} email - The email of the user.
     * @param {string} password - The password of the user.
     * @param {object} router - The router object.
     */
    async register(email, password, router) {
        try {
            await this.account.create(ID.unique(), email, password);
            await this.login(email, password, router);
        } catch (err) {
            console.error(err);
            alert('Registration failed');
        }
    }

    /**
     * Retrieves existing user session.
     */
    async getSession() {
        try {
            let res = await this.account.get();
            this.sessionInfo = res;
            this.uid = res.$id;
            return res;
        } catch (err) {
            this.uid = null;
            this.sessionInfo = null;
            console.error(err);
            return { $id: null };
        }
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
    async createFeed(url) {
        if (this.uid == null) {
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
            let articleSource = JSON.parse(res.response);
            articleSource = articleSource.data[0];
            feed = {
                title: articleSource.data.title,
                items: articleSource.data.articles,
            };
        } catch (err) {
            alert('Could not add feed source');
            console.error(err);
            return null;
        }
        if (feed == null) {
            alert('Could not add feed source');
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
            let articleSources = JSON.parse(res.response).data;
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
     * @returns {JSX.Element|null} - The generated HTML content for the article, or null if an error occurs.
     */
    async getArticle(url, title) {
        try {
            let res = await this.functions.createExecution(
                APPWRITE_CONFIG.FETCH_ARTICLES,
                JSON.stringify({ type: 'article', urls: [url] }),
                false,
                '/',
                'GET'
            );
            let articles_res = JSON.parse(res.response).data[0];
            if (articles_res.status != 200)
                return <div>Error fetching article.</div>;
            let article = articles_res.data;
            let content = [
                <a
                    href={`//${url}`}
                    target="_blank"
                    style={{ color: 'blue', textDecoration: 'underline' }}
                >
                    View original content
                </a>,
                <br />,
                <h1 style={{ textAlign: 'center', margin: '10px' }}>
                    {title}
                </h1>,
                <br />,
            ];
            for (let tag of article.tags) {
                content.push(<p>{tag}</p>);
                content.push(<br />);
            }
            for (let i = 0; i < 15; i++) {
                content.push(<br />);
            }

            return <div>{content}</div>;
        } catch (err) {
            console.error(err);
            return null;
        }
    }
}
