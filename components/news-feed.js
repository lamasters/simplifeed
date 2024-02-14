import { useEffect, useRef, useState } from 'react';

import Card from './card';
import styles from '../styles/feed.module.css';

/**
 * Returns the timestamp of the given publication date.
 * @param {string} pub_date - The publication date in string format.
 * @returns {number} - The timestamp of the publication date.
 */
function getDate(pub_date) {
    let date = new Date(pub_date);
    return date.getTime();
}

/**
 * Sorts an array of feed items based on their publication date.
 * @param {Array} articles - The array of feed items to be sorted.
 */
export function sortFeedItems(articles) {
    articles.sort((a, b) => {
        let dateA = getDate(a.pub_date);
        let dateB = getDate(b.pub_date);

        if (dateA > dateB) {
            return -1;
        }
        if (dateA < dateB) {
            return 1;
        }
        return 0;
    });
}

/**
 * Concatenates the items from multiple sources into a single array.
 *
 * @param {Array} sources - An array of sources, each containing an 'items' property.
 * @returns {Array} - An array containing all the items from the sources.
 */
function concatSources(sources) {
    let articles = [];
    for (let source of sources) {
        articles = articles.concat(source.items);
    }
    return articles;
}

/**
 * Compares two feed objects and checks if their articles are equal.
 * @param {Object} a - The first feed object.
 * @param {Object} b - The second feed object.
 * @returns {boolean} - Returns true if the articles in the feeds are equal, otherwise returns false.
 */
function feedsEqual(a, b) {
    let articlesA = concatSources(a);
    let articlesB = concatSources(b);
    sortFeedItems(articlesA);
    sortFeedItems(articlesB);
    if (articlesA.length !== articlesB.length) return false;
    for (let i = 0; i < articlesA.length; i++) {
        if (articlesA[i].title !== articlesB[i].title) return false;
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
    let articles = concatSources(feedData);
    if (filter) {
        articles = articles.filter((item) => item.source == filter);
    }
    sortFeedItems(articles);
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
    console.log('Article list', articleList);
    return (
        <div ref={feedRef} id={styles.feed_container}>
            <div id={styles.feed_content}>
                {props.showTutorial ? (
                    seenTutorial ? (
                        <div id={styles.tutorial}>Loading articles...</div>
                    ) : (
                        <div id={styles.tutorial}>
                            Add feeds to start seeing articles!
                            <br />
                            Try adding{' '}
                            <em>https://www.linuxinsider.com/rss-feed</em>
                        </div>
                    )
                ) : null}
                {!feedsEqual(props.feedData, props.loadedData) &&
                !props.articleOpen ? (
                    <div
                        className={`${styles.update} ${styles.slide_bottom}`}
                        onClick={() => {
                            // Update the feed data in the state and local storage
                            localStorage.setItem(
                                'feedData',
                                JSON.stringify(props.loadedData)
                            );
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
                ) : null}
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
                </ul>
            </div>
        </div>
    );
}
