import { FETCH_INTERVAL } from './constants';

/**
 * Fetches feed data and updates the state.
 * @param {Object} state - Hooks to set application state.
 */
export async function fetchData(state, fetchFeedsFail) {
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
    let feedData = await state.session.getArticleSources(fetchFeedsFail);
    if (feedData === null) return;
    if (feedData.length > 0) state.setShowTutorial(false);

    state.setFeedData(feedData);
    state.setLoadedData(feedData);
    localStorage.setItem('lastFetch', Date.now());
    localStorage.setItem('feedData', JSON.stringify(feedData));

    state.setLoading(false);
    state.setProUser(true);
    // AI FOR EVERYONE!
    // await state.session.checkProUser(state.setProUser);
}

/**
 * Fetch podcast data and update the state.
 * @param {state} state
 */
export async function fetchPodcasts(state) {
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
    let storedPodcasts = localStorage.getItem('podcastData');
    if (storedPodcasts) {
        state.setPodcastData(JSON.parse(storedPodcasts));
        state.setLoadedData(JSON.parse(storedPodcasts));
    }
    let podcasts = await state.session.getPodcasts(state.errorToast);
    if (podcasts === null) return;
    state.setPodcastData(podcasts);
    state.setLoadedData(podcasts);
    localStorage.setItem('lastFetch', Date.now());
    localStorage.setItem('podcastData', JSON.stringify(podcasts));
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

export async function backgroundFetch(state) {
    const lastFetch = localStorage.getItem('lastFetch');
    if (!lastFetch || Date.now() - lastFetch > FETCH_INTERVAL) {
        console.debug('Background fetch');
        let feedData = await state.session.getArticleSources(null);
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
        article.author,
        article.pub_date,
        state.setRawText
    );
    state.setArticleContent(articleContent);
    state.setLoading(false);
    await state.session.recordArticleRead(article);
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
 * Adds a podcast to the state and updates the podcast data.
 * @param {string} url - The URL of the podcast to be added.
 * @param {object} state - The state object containing session and feed data.
 * @param {Array} podcastData - The current feed data.
 */
export async function addPodcast(url, state, podcastData, addPodcastFail) {
    if (!url.includes('https://') && !url.includes('http://')) {
        url = 'https://' + url;
    }
    let podcast = await state.session.createPodcast(url, addPodcastFail);
    if (podcast === null) return;
    let newPodcastData = podcastData.concat(podcast);
    state.setPodcastData(newPodcastData);
    state.setLoadedData(newPodcastData);
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
    return await state.session.searchFeeds(query);
}

export async function searchPodcasts(state, query) {
    return await state.session.searchPodcasts(query);
}
