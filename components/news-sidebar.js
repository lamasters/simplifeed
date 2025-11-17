import {
    fetchNewsData,
    searchNewsFeeds,
    subscribeToNewsFeed,
} from '../util/feed-api';
import { useEffect, useState } from 'react';

import { Typeahead } from 'react-typeahead';
import styles from '../styles/sidebar.module.css';

function sortedFeeds(feedData) {
    let feedDataCopy = feedData.copyWithin();
    feedDataCopy.sort((a, b) => {
        let a_title = a.feed_title.toLowerCase();
        let b_title = b.feed_title.toLowerCase();
        if (a_title < b_title) {
            return -1;
        }
        if (a_title > b_title) {
            return 1;
        }
        return 0;
    });
    return feedDataCopy;
}

function selectFeed(filter, state) {
    state.setFilter(filter);
    fetchNewsData(state, 100, 0, filter);
}

async function deleteFeed(source, props) {
    props.state.setLoading(true);
    await props.state.session.deleteNewsSubscription(source.$id);
    await props.state.session.getSubscriptions();
    const newFeedData = props.feedData.filter(
        (article) => article.news_feed.$id !== source.$id
    );
    const newLoadedData = props.loadedData.filter(
        (article) => article.news_feed.$id !== source.$id
    );
    props.state.setFeedData(newFeedData);
    props.state.setLoadedData(newLoadedData);
    props.state.setLoading(false);
    if (props.filter === source.$id) {
        selectFeed(null, props.state);
    }
}

function getFeedIcon(source, editing, props) {
    if (editing) {
        return (
            <img
                id={styles.trash}
                src="/close.svg"
                width="24px"
                height="24px"
                onClick={async () => {
                    await deleteFeed(source, props);
                }}
            />
        );
    } else {
        if (!source.rss_url) {
            return null;
        }
        let url;
        try {
            url = new URL(source.rss_url).origin;
        } catch {
            console.error('Invalid URL');
        }
        return (
            <img
                id={styles.icon}
                src={`https://www.google.com/s2/favicons?sz=64&domain=${url}`}
                width="28px"
                height="28px"
            />
        );
    }
}

/**
 * Renders the sidebar component.
 *
 * @param {Object} props - The component props.
 * @returns {JSX.Element} The rendered sidebar component.
 */
export default function NewsSidebar(props) {
    const [url, setURL] = useState('');
    const [editing, setEditing] = useState(false);
    const [feedOptions, setFeedOptions] = useState([]);
    const [displayOptions, setDisplayOptions] = useState([]);
    const [subscriptions, setSubscriptions] = useState(
        props.state.session.newsSubscriptions
    );

    useEffect(() => {
        setSubscriptions(props.state.session.newsSubscriptions);
    }, [props.state.session.newsSubscriptions]);

    return (
        <div id={styles.sidebar}>
            <div id={styles.navbar}>
                <h1 className={styles.nav}>SimpliFeed</h1>
            </div>
            <h2>News</h2>
            <ul id={styles.feedlist}>
                <div className={styles.source_row}>
                    <li
                        onClick={() => selectFeed(null, props.state)}
                        className={styles.source}
                        style={{ width: '100%' }}
                        key={0}
                    >
                        All Feeds
                    </li>
                </div>
                {sortedFeeds(subscriptions).map((feed) => (
                    <div className={styles.source_row} key={feed?.feed_title}>
                        {getFeedIcon(feed, editing, props)}
                        <li
                            onClick={() => selectFeed(feed.$id, props.state)}
                            className={styles.source}
                        >
                            {feed?.feed_title}
                        </li>
                    </div>
                ))}
            </ul>
            <div id={styles.add}>
                <button
                    onClick={() => {
                        setEditing(!editing);
                    }}
                >
                    {editing ? 'Done' : 'Edit Feeds'}
                </button>
                <label>Search Feeds</label>
                <Typeahead
                    options={displayOptions}
                    maxVisible={5}
                    onChange={async (e) => {
                        setURL(e.target.value);
                        let feeds = await searchNewsFeeds(
                            props.state,
                            e.target.value
                        );
                        setFeedOptions(feeds);
                        setDisplayOptions(feeds.map((feed) => feed.title));
                    }}
                    onOptionSelected={(title) => {
                        let feed = feedOptions.find(
                            (feed) => feed.title === title
                        );
                        if (feed) {
                            subscribeToNewsFeed(
                                feed.url,
                                props.state,
                                props.addFeedFail
                            );
                        }
                        setFeedOptions([]);
                        setDisplayOptions([]);
                    }}
                    customClasses={{
                        results: styles.search_results,
                        listItem: styles.search_item,
                    }}
                    placeholder={'News feed name or RSS URL'}
                />
                <button
                    onClick={() => {
                        props.infoToast(
                            'Adding news feed... this may take a few minutes.'
                        );
                        subscribeToNewsFeed(
                            url,
                            props.state,
                            props.addFeedFail
                        );
                    }}
                    type="submit"
                >
                    Add Feed
                </button>
            </div>
            <button
                onClick={() => props.state.router.push('/podcasts')}
                type="submit"
            >
                Switch to Podcasts
            </button>
            <button
                id={styles.logout}
                onClick={() =>
                    props.state.session.logout(
                        props.state.router,
                        props.logoutFail
                    )
                }
            >
                Logout
            </button>
        </div>
    );
}
