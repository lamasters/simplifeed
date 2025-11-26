import { useEffect, useRef, useState } from 'react';

import ArticleCard from './article-card';
import { loadMoreNewsData } from '../util/feed-api';
import styles from '../styles/feed.module.css';

const PAGE_SIZE = 100;

/**
 * Compares two feed objects and checks if their articles are equal.
 * @param {Object} a - The first feed object.
 * @param {Object} b - The second feed object.
 * @returns {boolean} - Returns true if the articles in the feeds are equal, otherwise returns false.
 */
function feedsEqual(a, b) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i].article_url !== b[i].article_url) return false;
    }
    return true;
}

/**
 * Creates an article list based on the provided feed data, filter, and sets the article list using the provided setter function.
 * @param {Array} feedData - The feed data containing articles from different sources.
 * @param {Function} setArticleList - The setter function to set the article list.
 */
function createArticleList(feedData, setArticleList) {
    let articles = feedData.copyWithin();
    setArticleList(articles);
}

/**
 * Renders a feed component.
 *
 * @param {Object} props - The component props.
 * @param {Array} props.feedData - The data for the feed.
 * @param {Array} props.loadedData - Feed data loaded in the background
 * @param {string} props.filter - The name of the source to display.
 * @param {boolean} props.showTutorial - Flag indicating whether to show the tutorial.
 * @param {Object} props.state - Hooks to set the application state.
 * @param {boolean} collapse -
 * @param {number} limit - The number of articles to load
 * @param {number} offset - The starting index to load from the database
 * @returns {JSX.Element} The rendered feed component.
 */
export default function NewsFeed(props) {
    const [articleList, setArticleList] = useState([]);
    const [seenTutorial, setSeenTutorial] = useState(false);
    useEffect(() => {
        if (localStorage.getItem('seenTutorial') !== null) {
            setSeenTutorial(true);
        } else {
            localStorage.setItem('seenTutorial', true);
        }
        createArticleList(props.feedData, setArticleList);
    }, [props.feedData]);
    const feedRef = useRef();
    return (
        <>
            <div id={styles.collapse_container}>
                <img
                    id={styles.collapse}
                    onClick={() => props.state.setCollapse(!props.collapse)}
                    src="/sidebar.svg"
                    width="30px"
                    height="30px"
                />
            </div>
            <div ref={feedRef} id={styles.feed_container}>
                <div id={styles.feed_content}>
                    {props.showTutorial &&
                        (seenTutorial ? (
                            <div id={styles.tutorial}>
                                There's nothing here...
                            </div>
                        ) : (
                            <div id={styles.tutorial}>
                                Add feeds to start seeing articles!
                                <br />
                                Try adding{' '}
                                <em>https://www.linuxinsider.com/rss-feed</em>
                            </div>
                        ))}
                    {!feedsEqual(props.feedData, props.loadedData) &&
                        !props.articleOpen && (
                            <div
                                className={`${styles.update} ${styles.slide_bottom}`}
                                onClick={() => {
                                    props.state.setFeedData(props.loadedData);
                                    feedRef.current.scrollTo({
                                        top: 0,
                                        left: 0,
                                        behavior: 'smooth',
                                    });
                                }}
                            >
                                Get Latest
                            </div>
                        )}
                    <ul style={{ width: '100%' }}>
                        {articleList.map((article) => (
                            <>
                                <ArticleCard article={article} state={props.state} />
                                <div
                                    className={styles.divider}
                                    key={article.title + '_divider'}
                                ></div>
                            </>
                        ))}
                        {props.feedData.length > 0 && (
                            <li
                                id={styles.load_more_card}
                                onClick={async () => {
                                    await loadMoreNewsData(
                                        props.state,
                                        props.feedData,
                                        props.limit,
                                        props.offset + PAGE_SIZE,
                                        props.filter
                                    );
                                    props.state.setOffset(
                                        props.offset + PAGE_SIZE
                                    );
                                }}
                            >
                                Load More
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </>
    );
}
