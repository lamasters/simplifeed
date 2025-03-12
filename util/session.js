import {
    Account,
    Client,
    Databases,
    Functions,
    ID,
    Permission,
    Query,
    Role,
    Storage,
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
        this.storage = new Storage(this.client);

        this.uid = null;
        this.sessionInfo = null;
        this.newsSubscriptions = [];
        this.podcastSubscriptions = [];
        this.subscriptions_id = null;
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
        await this.getSubscriptions();
        return { ...userSession, verified: verified };
    }

    async getSubscribedFeeds(feed_ids, collection_id) {
        if (feed_ids.length === 0) return [];
        const feed_queries = feed_ids.map((id) => Query.equal('$id', id));
        const queries = [];
        if (feed_queries.length === 1) {
            queries.push(feed_queries[0]);
        } else if (feed_queries.length > 1) {
            queries.push(Query.or(feed_queries));
        }
        const res = await this.database.listDocuments(
            APPWRITE_CONFIG.FEEDS_DB,
            collection_id,
            [
                Query.limit(100),
                ...queries,
                Query.select(['feed_title', 'rss_url', 'image_url', '$id']),
            ]
        );
        return res.documents;
    }

    /**
     * Retrieves the feeds for the current user.
     */
    async getSubscriptions() {
        try {
            const res = await this.database.listDocuments(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.SUBSCRIPTIONS,
                [Query.select(['$id', 'news_feed_ids', 'podcast_feed_ids'])]
            );
            if (res.documents.length === 0) {
                this.subscriptions_id = ID.unique();
                await this.database.createDocument(
                    APPWRITE_CONFIG.FEEDS_DB,
                    APPWRITE_CONFIG.SUBSCRIPTIONS,
                    this.subscriptions_id,
                    { news_feed_ids: [], podcast_feed_ids: [] },
                    [
                        Permission.read(Role.user(this.uid)),
                        Permission.update(Role.user(this.uid)),
                    ]
                );
                this.newsSubscriptions = [];
                this.podcastSubscriptions = [];
            } else {
                this.subscriptions_id = res.documents[0].$id;
                const subscriptions = res.documents[0];

                if (subscriptions) {
                    const promises = [
                        this.getSubscribedFeeds(
                            subscriptions.news_feed_ids,
                            APPWRITE_CONFIG.NEWS_FEEDS
                        ),
                        this.getSubscribedFeeds(
                            subscriptions.podcast_feed_ids,
                            APPWRITE_CONFIG.PODCAST_FEEDS
                        ),
                    ];
                    const [newsFeeds, podcastFeeds] =
                        await Promise.allSettled(promises);
                    this.newsSubscriptions = newsFeeds.value;
                    this.podcastSubscriptions = podcastFeeds.value;
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Subscribes to a news rss feed.
     *
     * @param {string} url - The URL of the feed source.
     */
    async createNewsSubscription(url, addFeedFail, setLoading) {
        setLoading(true);
        if (!url) {
            addFeedFail();
            setLoading(false);
            return null;
        }
        if (this.uid === null) {
            await this.getSession();
        }
        if (this.subscriptions_id === null) await this.getSubscriptions();

        try {
            let res = await this.functions.createExecution(
                APPWRITE_CONFIG.CREATE_NEWS_FEED_FN,
                JSON.stringify({
                    subscriptions_id: this.subscriptions_id,
                    url: url,
                }),
                true,
                '/',
                'GET'
            );
            let execution_id = res.$id;
            while (res.status !== 'completed' && res.status !== 'failed') {
                res = await this.functions.getExecution(
                    APPWRITE_CONFIG.CREATE_NEWS_FEED_FN,
                    execution_id
                );
            }
            await this.getSubscriptions();
            const articles = await this.getNewsArticles();
            setLoading(false);
            return articles;
        } catch (err) {
            console.error(err);
            addFeedFail();
            setLoading(false);
            return null;
        }
    }

    /**
     * Deletes a feed from the database.
     * @param {string} id - The ID of the feed to delete.
     */
    async deleteNewsSubscription(id) {
        try {
            await this.database.updateDocument(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.SUBSCRIPTIONS,
                this.subscriptions_id,
                {
                    news_feed_ids: this.newsSubscriptions
                        .filter((source) => source.$id !== id)
                        .map((source) => source.$id),
                }
            );
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Retrieves articles from the user's subscribed news feeds.
     * @returns {Array<Object>|null} An array of all articles, or null if an error occurs.
     */
    async getNewsArticles(limit = 100, offset = 0) {
        if (!this.newsSubscriptions) await this.getSubscriptions();
        if (this.newsSubscriptions.length === 0) return [];
        const subscription_queries = this.newsSubscriptions.map((source) =>
            Query.equal('news_feed', source.$id)
        );
        const queries = [
            Query.limit(limit),
            Query.offset(offset),
            Query.orderDesc('pub_date'),
        ];
        if (subscription_queries.length === 1) {
            queries.push(subscription_queries[0]);
        } else if (subscription_queries.length > 1) {
            queries.push(Query.or(subscription_queries));
        }
        try {
            const articles = await this.database.listDocuments(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.NEWS_ARTICLES,
                queries
            );
            return articles.documents;
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
                APPWRITE_CONFIG.GET_ARTICLE_FN,
                JSON.stringify({ url: url }),
                false,
                '/',
                'GET'
            );
            const article = JSON.parse(res.responseBody).data;
            if (res.responseStatusCode != 200)
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
            let url_origin = new URL(url).origin;
            let flex_dir =
                window.innerWidth > window.innerHeight ? 'row' : 'column';
            let width = Math.min(screen.width, window.innerWidth);
            let content = [
                <span
                    style={{
                        display: 'flex',
                        flexDirection: flex_dir,
                        justifyItems: 'center',
                        alignItems: 'center',
                        margin: 'auto',
                        textAlign: 'center',
                    }}
                >
                    <a
                        href={url}
                        target="_blank"
                        style={{
                            color: 'blue',
                            textDecoration: 'underline',
                            margin: 'auto',
                        }}
                    >
                        View original article
                    </a>
                </span>,
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
                    {' '}
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
            let tagCount = 0;
            for (let tag of article.tags) {
                rawText += tag + '\n';
                content.push(
                    <p
                        style={{
                            width: '70%',
                            minWidth: `${Math.max(width * 0.7, 275)}px`,
                            margin: 'auto',
                        }}
                        key={tagCount}
                    >
                        {tag}
                    </p>
                );
                tagCount++;
                content.push(<br key={tagCount} />);
                tagCount++;
            }
            for (let i = 0; i < 15; i++) {
                content.push(<br key={tagCount + i + 1} />);
            }
            setRawText(rawText);

            return <div>{content}</div>;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    async downloadSummary(articleId) {
        try {
            const article = await this.database.getDocument(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.NEWS_ARTICLES,
                articleId
            );
            if (article.summary_id) {
                const summary = await this.storage.getFileView(
                    APPWRITE_CONFIG.SUMMARY_BUCKET_ID,
                    article.summary_id
                );
                const summaryFile = await fetch(summary.href);
                const summaryBuffer = await summaryFile.body.getReader().read();
                const summaryText = new TextDecoder().decode(
                    summaryBuffer.value
                );
                return JSON.parse(summaryText).summary;
            }
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    /**
     * Retrieves the AI summary of an article.
     * @param {string} article - The article to retrieve the summary for.
     */
    async getSummary(article, articleId) {
        const download = await this.downloadSummary(articleId);
        if (download) return download;
        try {
            let res = await this.functions.createExecution(
                APPWRITE_CONFIG.SUMMARIZE_ARTICLE_FN,
                JSON.stringify({
                    user_id: this.uid,
                    article: article,
                    article_id: articleId,
                }),
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

    async searchNewsFeeds(query) {
        let feeds = [];
        try {
            let res = await this.database.listDocuments(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.NEWS_FEEDS,
                [
                    Query.or([
                        Query.contains('feed_title', query),
                        Query.contains('rss_url', query),
                    ]),
                    Query.limit(100),
                ]
            );
            for (let feed of res.documents) {
                if (!feeds.includes(feed.feed_title)) {
                    feeds.push({ title: feed.feed_title, url: feed.rss_url });
                }
            }
        } catch (err) {
            console.error(err);
        }
        feeds.sort((a, b) => {
            a.title < b.title ? -1 : 1;
        });
        return feeds;
    }

    /**
     * Retrieves the user's podcasts.
     * @returns {Array<Object>|null} The user's podcast episodes, or null if an error occurs.
     */
    async getPodcastEpisodes(limit = 100, offset = 0) {
        if (!this.podcastSubscriptions) await this.getSubscriptions();
        if (this.podcastSubscriptions.length === 0) return [];
        const subscription_queries = this.podcastSubscriptions.map((source) =>
            Query.equal('podcast_feed', source.$id)
        );
        const queries = [
            Query.limit(limit),
            Query.offset(offset),
            Query.orderDesc('pub_date'),
        ];
        if (subscription_queries.length === 1) {
            queries.push(subscription_queries[0]);
        } else if (subscription_queries.length > 1) {
            queries.push(Query.or(subscription_queries));
        }
        try {
            const episodes = await this.database.listDocuments(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.PODCAST_EPISODES,
                queries
            );
            return episodes.documents;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    async createPodcastSubscription(url, addPodcastFail, setLoading) {
        setLoading(true);
        if (!url) {
            addPodcastFail(`Failed to add podcast from ${url}`);
            setLoading(false);
            return null;
        }
        if (this.uid === null) {
            await this.getSession();
        }
        if (this.subscriptions_id === null) await this.getSubscriptions();

        try {
            let res = await this.functions.createExecution(
                APPWRITE_CONFIG.CREATE_PODCAST_FEED_FN,
                JSON.stringify({
                    subscriptions_id: this.subscriptions_id,
                    url: url,
                }),
                true,
                '/',
                'GET'
            );
            let execution_id = res.$id;
            while (res.status !== 'completed' && res.status !== 'failed') {
                res = await this.functions.getExecution(
                    APPWRITE_CONFIG.CREATE_PODCAST_FEED_FN,
                    execution_id
                );
            }
            await this.getSubscriptions();
            const episodes = await this.getPodcastEpisodes();
            setLoading(false);
            return episodes;
        } catch (err) {
            console.error(err);
            addPodcastFail(`Failed to add podcast from ${url}`);
            setLoading(false);
            return null;
        }
    }

    /**
     * Deletes a podcast from the database.
     * @param {string} id - The ID of the podcast to delete.
     */
    async deletePodcastSubscription(id) {
        try {
            await this.database.updateDocument(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.SUBSCRIPTIONS,
                this.subscriptions_id,
                {
                    podcast_feed_ids: this.podcastSubscriptions
                        .filter((source) => source.$id !== id)
                        .map((source) => source.$id),
                }
            );
        } catch (err) {
            console.error(err);
        }
    }

    async searchPodcastFeeds(query) {
        let podcasts = [];
        try {
            let res = await this.database.listDocuments(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.PODCAST_FEEDS,
                [
                    Query.or([
                        Query.contains('feed_title', query),
                        Query.contains('rss_url', query),
                    ]),
                    Query.limit(100),
                ]
            );
            for (let podcast of res.documents) {
                if (!podcasts.includes(podcast.feed_title)) {
                    podcasts.push({
                        title: podcast.feed_title,
                        url: podcast.rss_url,
                    });
                }
            }
        } catch (err) {
            console.error(err);
        }
        podcasts.sort((a, b) => {
            a.title < b.title ? -1 : 1;
        });
        return podcasts;
    }

    async setPodcastListenTime(episode_id, time) {
        try {
            const res = await this.database.listDocuments(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.LISTEN_TIME,
                [Query.equal('episode_id', episode_id)]
            );
            if (res.documents.length) {
                const listen_record = res.documents[0];
                await this.database.updateDocument(
                    APPWRITE_CONFIG.FEEDS_DB,
                    APPWRITE_CONFIG.LISTEN_TIME,
                    listen_record.$id,
                    { time: time, finished: false }
                );
            } else {
                await this.database.createDocument(
                    APPWRITE_CONFIG.FEEDS_DB,
                    APPWRITE_CONFIG.LISTEN_TIME,
                    ID.unique(),
                    { episode_id: episode_id, time: time, finished: false },
                    [
                        Permission.read(Role.user(this.uid)),
                        Permission.write(Role.user(this.uid)),
                        Permission.update(Role.user(this.uid)),
                    ]
                );
            }
        } catch (err) {
            console.error(err);
        }
    }

    async setPodcastFinished(episode_id) {
        try {
            const res = await this.database.listDocuments(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.LISTEN_TIME,
                [Query.equal('episode_id', episode_id)]
            );
            const listen_record = res.documents[0];
            await this.database.updateDocument(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.LISTEN_TIME,
                listen_record.$id,
                { finished: true }
            );
        } catch (err) {
            console.error(err);
        }
    }

    async getPodcastListenTime(episode_id) {
        try {
            const res = await this.database.listDocuments(
                APPWRITE_CONFIG.FEEDS_DB,
                APPWRITE_CONFIG.LISTEN_TIME,
                [Query.equal('episode_id', episode_id)]
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
                [Query.limit(500), Query.orderDesc('$createdAt')]
            );
            return res.documents;
        } catch (err) {
            console.error(err);
            return [];
        }
    }
}
