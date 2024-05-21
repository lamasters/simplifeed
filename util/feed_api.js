import { FETCH_INTERVAL } from './constants';

/**
 * Fetches feed data and updates the state.
 * @param {Object} state - Hooks to set application state.
 */
export async function fetchData(state) {
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

    // Pull feed data from local storage
    let storedFeeds = localStorage.getItem('feedData');
    if (storedFeeds) {
        state.setFeedData(JSON.parse(storedFeeds));
        state.setLoadedData(JSON.parse(storedFeeds));
        if (storedFeeds.length > 0) state.setShowTutorial(false);
    }
    let feedData = await state.session.getArticleSources();
    if (feedData === null) return;
    if (feedData.length > 0) state.setShowTutorial(false);

    state.setFeedData(feedData);
    state.setLoadedData(feedData);
    localStorage.setItem('lastFetch', Date.now());
    localStorage.setItem('feedData', JSON.stringify(feedData));

    state.setLoading(false);
    await state.session.checkProUser(state.setProUser);
}

export async function backgroundFetch(state) {
    const lastFetch = localStorage.getItem('lastFetch');
    if (!lastFetch || Date.now() - lastFetch > FETCH_INTERVAL) {
        console.debug('Background fetch');
        let feedData = await state.session.getArticleSources();
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
    let articleContent = await state.session.getArticle(
        article.link,
        article.title,
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
export async function addFeed(url, state, feedData, addFeedFail) {
    if (!url.includes('https://') && !url.includes('http://')) {
        url = 'https://' + url;
    }
    let feed = await state.session.createFeed(url, addFeedFail);
    if (feed === null) return;
    let newFeedData = feedData.concat(feed);
    state.setFeedData(newFeedData);
    state.setLoadedData(newFeedData);
}

/**
 * Retrieves the summary of an article using the provided session object.
 * @param {Object} state - Hooks to set application state.
 * @param {Object} article - The article text.
 * @param {Function} setSummary - The function to set the summary.
 */
export async function getArticleSummary(state, article, setSummary) {
    state.setLoading(true);
    let summary = await state.session.getSummary(article);
    setSummary(summary);
    state.setLoading(false);
}

export async function searchFeeds(state, query) {
    let feeds = await state.session.searchFeeds(query);
    console.log(feeds);
    return feeds;
}
