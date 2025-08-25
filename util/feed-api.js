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
    if (feedData === null) return;
    if (feedData.length > 0) state.setShowTutorial(false);

    state.setFeedData(feedData);
    state.setLoadedData(feedData);

    state.setLoading(false);
}

export async function loadMoreNewsData(state, feedData, limit, offset, filter) {
    state.setLoading(true);
    let articles = await state.session.getNewsArticles(limit, offset, filter);
    if (articles === null) return;
    state.setFeedData([...feedData, ...articles]);
    state.setLoadedData([...feedData, ...articles]);
    state.setLoading(false);
}

/**
 * Fetch podcast data and update the state.
 * @param {state} state
 */
export async function fetchPodcastData(state) {
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
    let podcasts = await state.session.getPodcastEpisodes();
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

export async function loadMorePodcastData(state, podcastData, limit, offset) {
    state.setLoading(true);
    let episodes = await state.session.getPodcastEpisodes(limit, offset);
    if (episodes === null) return;
    state.setPodcastData([...podcastData, ...episodes]);
    state.setLoading(false);
}

export async function backgroundFetch(state, filter) {
    const lastFetch = localStorage.getItem('lastFetch');
    if (!lastFetch || Date.now() - lastFetch > FETCH_INTERVAL) {
        console.debug('Background fetch');
        let feedData = await state.session.getNewsArticles(0, 100, filter);
        if (feedData) {
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

export async function searchPodcastFeeds(state, query) {
    return await state.session.searchPodcastFeeds(query);
}
