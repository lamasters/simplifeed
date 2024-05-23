import { addFeed, searchFeeds } from '../util/feed_api';

import { Typeahead } from 'react-typeahead';
import styles from '../styles/sidebar.module.css';
import { useState } from 'react';

/**
 * Deletes a feed from the feedData and loadedData arrays, updates the filter state, and saves the updated feedData to localStorage.
 * @param {Array} feedData - The array of feed data.
 * @param {Array} loadedData - The array of loaded feed data.
 * @param {string} filter - The current filter value.
 * @param {object} state - Hooks to manipulate application state.
 * @param {string} source - The title of the feed to be deleted.
 */
function deleteFeed(feedData, loadedData, filter, state, source) {
    const filteredFeed = feedData.filter((feed) => feed.title !== source);
    state.setFeedData(filteredFeed);
    const filteredLoaded = loadedData.filter((feed) => feed.title !== source);
    state.setLoadedData(filteredLoaded);
    if (filter === source) {
        state.setFilter(null);
    }
    localStorage.setItem('feedData', JSON.stringify(filteredFeed));
}

function sortedFeeds(feedData) {
    let feedDataCopy = feedData.slice();
    feedDataCopy.sort((a, b) => {
        let a_title = a.title.toLowerCase();
        let b_title = b.title.toLowerCase();
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

function getFeedIcon(source, editing) {
    if (editing) {
        return (
            <img
                id={styles.trash}
                src="/trash.png"
                width="28px"
                height="28px"
                onClick={async () => {
                    await props.state.session.deleteFeed(source.id);
                    deleteFeed(
                        props.feedData,
                        props.loadedData,
                        props.filter,
                        props.state,
                        source?.title
                    );
                }}
            />
        );
    } else {
        let url = source.url.replace('https://', '').split('/')[0];
        try {
            url = new URL(source.url).origin;
            if (source.items.length > 0) {
                url = new URL(source.items[0]?.link).origin;
            }
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
export default function Sidebar(props) {
    const [url, setURL] = useState('');
    const [editing, setEditing] = useState(false);
    const [feedOptions, setFeedOptions] = useState([]);
    return (
        <div id={styles.sidebar}>
            <div id={styles.navbar}>
                <img
                    className={styles.nav}
                    src="/simplifeed.png"
                    width="64px"
                    height="64px"
                />
                <h1 className={styles.nav}>SimpliFeed</h1>
            </div>
            <h2>Feeds</h2>
            <ul id={styles.feedlist}>
                <div className={styles.source_row}>
                    <li
                        onClick={() => props.state.setFilter(null)}
                        className={styles.source}
                        style={{ width: '100%' }}
                        key={0}
                    >
                        All Feeds
                    </li>
                </div>
                {sortedFeeds(props.feedData).map((source) => (
                    <div className={styles.source_row} key={source?.title}>
                        {getFeedIcon(source, editing)}
                        <li
                            onClick={() => props.state.setFilter(source?.title)}
                            className={styles.source}
                        >
                            {source?.title}
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
                    options={feedOptions}
                    maxVisible={5}
                    onChange={async (e) => {
                        setURL(e.target.value);
                        let feeds = await searchFeeds(
                            props.state,
                            e.target.value
                        );
                        setFeedOptions(feeds);
                    }}
                    onOptionSelected={(url) => {
                        setURL(url);
                        setFeedOptions([]);
                    }}
                    customClasses={{
                        results: styles.search_results,
                        listItem: styles.search_item,
                    }}
                />
                <button
                    onClick={() => {
                        addFeed(
                            url,
                            props.state,
                            props.feedData,
                            props.addFeedFail
                        );
                    }}
                    type="submit"
                >
                    Add Feed
                </button>
            </div>
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
