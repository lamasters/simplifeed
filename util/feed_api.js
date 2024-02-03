export async function fetchData(state) {
    state.setLoading(true);
    // pull feed data from local storage
    let info = await state.session.getSession();
    if (info.$id == null) {
        state.router.push('/login');
    }

    let feedData = await state.session.getArticleSources();
    if (feedData === null) return;
    if (feedData.length > 0) state.setShowTutorial(false);
    state.setFeedData(feedData);
    state.setLoading(false);
}

export async function selectArticle(article, state) {
    state.setLoading(true);
    state.setArticleOpen(true);
    let articleContent = await state.session.getArticle(
        article.link,
        article.title
    );
    state.setArticleContent(articleContent);
    state.setLoading(false);
}

export async function addFeed(url, state) {
    await state.session.createFeed(url);
    await fetchData(state);
}
