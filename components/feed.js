import { useEffect, useState } from 'react';

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
 * Creates an article list based on the provided feed data, filter, and sets the article list using the provided setter function.
 * @param {Array} feedData - The feed data containing articles from different sources.
 * @param {Function} setArticleList - The setter function to set the article list.
 * @param {string} [filter] - Optional filter to only include articles from a specific source.
 */
function createArticleList(feedData, setArticleList, filter) {
    let articles = [];
    for (let source of feedData) {
        articles = articles.concat(source.items);
    }
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
export default function Feed(props) {
    const [articleList, setArticleList] = useState([]);
    useEffect(() => {
        createArticleList(props.feedData, setArticleList, props.filter);
    }, [props.feedData, props.filter]);
    return (
        <div id={styles.feed_container}>
            <div id={styles.feed_content}>
                {props.showTutorial ? (
                    <div id={styles.tutorial}>
                        Add feeds to start seeing articles!
                        <br />
                        Try adding{' '}
                        <em>https://www.linuxinsider.com/rss-feed</em>
                    </div>
                ) : null}
                <ul style={{ width: '100%' }}>
                    {articleList.map((article) => (
                        <>
                            <Card article={article} state={props.state} />
                            <div className={styles.divider}></div>
                        </>
                    ))}
                </ul>
            </div>
        </div>
    );
}
