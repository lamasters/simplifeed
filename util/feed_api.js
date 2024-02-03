/**
 * Fetches feed data and updates the state.
 * @param {Object} state - Hooks to set application state.
 */
export async function fetchData(state) {
    state.setLoading(true);
    let info = await state.session.getSession();
    if (info.$id == null) {
        state.router.push('/login');
    }

    // Pull feed data from local storage
    let storedFeeds = localStorage.getItem('feedData');
    if (storedFeeds) {
        state.setFeedData(JSON.parse(storedFeeds));
        state.setLoading(false);
        if (storedFeeds.length > 0) state.setShowTutorial(false);
    }
    let feedData = await state.session.getArticleSources();
    if (feedData === null) return;
    if (feedData.length > 0) state.setShowTutorial(false);

    // Update the feed data in the state and local storage
    localStorage.setItem('feedData', JSON.stringify(feedData));
    state.setFeedData(feedData);
    state.setLoading(false);
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
        article.title
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
export async function addFeed(url, state, feedData) {
    let feed = await state.session.createFeed(url);
    let newFeedData = feedData.concat(feed);
    state.setFeedData(newFeedData);
}
