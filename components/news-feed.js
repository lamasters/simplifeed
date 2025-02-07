import { useEffect, useRef, useState } from 'react';

import Card from './card';
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
 * @param {string} [filter] - Optional filter to only include articles from a specific source.
 */
function createArticleList(feedData, setArticleList, filter) {
    let articles = feedData.copyWithin();
    if (filter) {
        articles = articles.filter((item) => item.newsFeeds.$id === filter);
    }
    setArticleList(articles);
}

/**
 * Renders a feed component.
 *
 * @param {Object} props - The component props.
 * @param {Array} props.feedData - The data for the feed.
 * @param {string} props.filter - The name of the source to display.
 * @param {boolean} props.showTutorial - Flag indicating whether to show the tutorial.
 * @param {string} props.state - Hooks to set the application state.
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
        createArticleList(props.feedData, setArticleList, props.filter);
    }, [props.feedData, props.filter]);
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
                                <Card article={article} state={props.state} />
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
                                        props.offset + PAGE_SIZE
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
