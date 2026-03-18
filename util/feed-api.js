import { FETCH_INTERVAL } from './constants';

/**
 * Fetches feed data and updates the state.
 * @param {Object} state - Hooks to set application state.
 */
export async function fetchNewsData(state, limit, offset, filter) {
    state.setLoading(true);
    let info = await state.session.getSession();
    if (info.$id == null) {
        state.router.push('/login');
        return;
    }
    if (!info.verified) {
        state.router.push('/not-verified');
        return;
    }

    let feedData = await state.session.getNewsArticles(limit, offset, filter);
    state.setLoading(false);
    if (feedData.length > 0) state.setShowTutorial(false);

    state.setFeedData(feedData);
    state.setLoadedData(feedData);
}

export async function loadMoreNewsData(state, feedData, limit, offset, filter) {
    state.setLoading(true);
    let articles = await state.session.getNewsArticles(limit, offset, filter);
    state.setLoading(false);
    state.setFeedData([...feedData, ...articles]);
    state.setLoadedData([...feedData, ...articles]);
}

/**
 * Fetch podcast data and update the state.
 * @param {Object} state - Hooks to set application state.
 * @param {number} limit - Number of episodes to fetch.
 * @param {number} offset - Offset for pagination.
 * @param {string|null} filter - Filter for specific podcast feed or special filters like 'continue' or 'unlistened'.
 */
export async function fetchPodcastData(state, limit, offset, filter) {
    state.setLoading(true);
    let info = await state.session.getSession();
    if (info.$id == null) {
        state.router.push('/login');
        return;
    }
    if (!info.verified) {
        state.router.push('/not-verified');
        return;
    }
    let podcasts = await state.session.getPodcastEpisodes(
        limit,
        offset,
        filter
    );
    if (podcasts === null) return;
    state.setPodcastData(podcasts);
    state.setLoadedData(podcasts);
    const listenTimes = await state.session.getPodcastListenTimes();
    const episodeNamesToListenTimes = new Map();
    listenTimes.forEach((listenTime) => {
        episodeNamesToListenTimes.set(listenTime.title, [
            listenTime.time,
            listenTime.finished,
        ]);
    });
    state.setListenTimes(episodeNamesToListenTimes);
    state.setLoading(false);
}

export async function loadMorePodcastData(
    state,
    podcastData,
    limit,
    offset,
    filter
) {
    state.setLoading(true);
    let episodes = await state.session.getPodcastEpisodes(
        limit,
        offset,
        filter
    );
    if (episodes === null) return;
    state.setPodcastData([...podcastData, ...episodes]);
    state.setLoading(false);
}

export async function backgroundFetch(state, filter) {
    const lastFetch = localStorage.getItem('lastFetch');
    if (!lastFetch || Date.now() - lastFetch > FETCH_INTERVAL) {
        console.debug('Background fetch');
        let feedData = await state.session.getNewsArticles(100, 0, filter);
        if (feedData.length > 0) {
            state.setLoadedData(feedData);
            localStorage.setItem('lastFetch', Date.now());
        }
    } else {
        console.debug('Background fetch skipped');
    }
}

/**
 * Selects an article and updates the state accordingly.
 * @param {Object} article - The article object to be selected.
 * @param {Object} state - Hooks to update application state.
 */
export async function selectArticle(article, state) {
    state.setLoading(true);
    state.setArticleOpen(true);
    // immediately expose the original URL so the detail component can render a link
    if (state.setArticleUrl) {
        state.setArticleUrl(article.article_url);
    }
    state.setArticleContent(null);
    state.router.push('#article');
    state.setSummary('');
    const summary = await state.session.downloadSummary(article.$id);
    if (summary) {
        state.setSummary(summary);
    }
    const articleContent = await state.session.getArticle(
        article.article_url,
        article.title,
        article.author,
        article.pub_date,
        state.setRawText
    );
    state.setArticleId(article.$id);
    state.setArticleContent(articleContent);
    state.setLoading(false);
}

/**
 * Opens the article summary page.
 * @param {Object} article - The article object to be displayed.
 * @param {Object} state - Hooks to update application state.
 */
export async function openArticleSummary(article, state) {
    state.setLoading(true);
    state.setArticleOpen(true);
    state.setViewMode('summary');

    if (state.setArticleUrl) {
        state.setArticleUrl(article.article_url);
    }
    state.setArticleId(article.$id);
    state.setArticleTitle(article.title);
    state.setArticleSource(article.news_feed.feed_title);

    state.setArticleContent(null);
    state.setSummary('');
    state.setRawText('');

    state.router.push('#summary');

    const summary = await state.session.getSummary(
        article.article_url,
        article.$id
    );
    if (summary) {
        state.setSummary(summary);
    } else if (summary === null) {
        state.setSummary('Failed to fetch summary.');
    }

    state.setLoading(false);
}

/**
 * Opens the article source in a new tab/window.
 * @param {Object} article - The article object with source URL.
 */
export function openArticleSource(article) {
    window.open(article.article_url, '_blank', 'noopener,noreferrer');
}

/**
 * Returns to the feed page from the summary or reader view.
 * @param {Object} state - Hooks to update application state.
 */
export function returnToFeed(state) {
    state.setArticleOpen(false);
    state.setViewMode('feed');
    state.router.push('/');
}

/**
 * Opens the reader view from the summary page.
 * @param {Object} state - Hooks to update application state.
 * @param {string} articleUrl - The article URL to fetch.
 * @param {string} articleTitle - The article title.
 * @param {string} articleAuthor - The article author.
 * @param {string} pubDate - The publication date.
 */
export async function openReaderView(
    state,
    articleUrl,
    articleTitle,
    articleAuthor,
    pubDate
) {
    state.setLoading(true);
    state.setViewMode('reader');

    state.router.push('#reader');

    const articleContent = await state.session.getArticle(
        articleUrl,
        articleTitle,
        articleAuthor,
        pubDate,
        state.setRawText
    );

    state.setArticleContent(articleContent);
    state.setLoading(false);
}

/**
 * Adds a feed to the state and updates the feed data.
 * @param {string} url - The URL of the feed to be added.
 * @param {object} state - The state object containing session and feed data.
 * @param {Array} feedData - The current feed data.
 */
export async function subscribeToNewsFeed(url, state, addFeedFail) {
    if (!url.includes('https://') && !url.includes('http://')) {
        url = 'https://' + url;
    }
    const articles = await state.session.createNewsSubscription(
        url,
        addFeedFail,
        state.setLoading
    );
    state.setFeedData(articles);
    state.setLoadedData(articles);
    return state.session.newsSubscriptions;
}

/**
 * Adds a podcast to the state and updates the podcast data.
 * @param {string} url - The URL of the podcast to be added.
 * @param {object} state - The state object containing session and feed data.
 * @param {Array} podcastData - The current feed data.
 */
export async function subscribeToPodcastFeed(
    url,
    state,
    addPodcastFail,
    addPodcastToast
) {
    if (!url.includes('https://') && !url.includes('http://')) {
        url = 'https://' + url;
    }
    addPodcastToast();
    const episodes = await state.session.createPodcastSubscription(
        url,
        addPodcastFail,
        state.setLoading
    );
    state.setPodcastData(episodes);
    state.setLoadedData(episodes);
    return state.session.podcastSubscriptions;
}

/**
 * Retrieves the summary of an article using the provided session object.
 * @param {Object} state - Hooks to set application state.
 * @param {Object} article - The article text.
 * @param {Function} setSummary - The function to set the summary.
 */
export async function getArticleSummary(state, article, articleId) {
    state.setLoading(true);
    const summary = await state.session.getSummary(article, articleId);
    state.setSummary(summary);
    state.setLoading(false);
}

export async function searchNewsFeeds(state, query) {
    return await state.session.searchNewsFeeds(query);
}

export async function searchNewsArticles(state, query, limit, offset, signal) {
    state.setLoading(true);
    let articles = await state.session.searchNewsArticles(
        query,
        limit,
        offset,
        signal
    );
    state.setLoading(false);
    return articles;
}

export async function searchPodcastFeeds(state, query) {
    return await state.session.searchPodcastFeeds(query);
}
