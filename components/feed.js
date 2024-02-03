import { useEffect, useState } from 'react';
import styles from '../styles/feed.module.css';
import Card from './card';

function getDate(pub_date) {
    let date = new Date(pub_date);
    return date.getTime();
}

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
