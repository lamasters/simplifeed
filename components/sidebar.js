import { addFeed } from '../util/feed_api';
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

/**
 * Renders the sidebar component.
 *
 * @param {Object} props - The component props.
 * @returns {JSX.Element} The rendered sidebar component.
 */
export default function Sidebar(props) {
    const [url, setURL] = useState('');
    const [editing, setEditing] = useState(false);
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
                {props.feedData.map((source) => (
                    <div className={styles.source_row} key={source?.title}>
                        {editing ? (
                            <img
                                id={styles.trash}
                                src="/trash.png"
                                width="28px"
                                height="28px"
                                onClick={async () => {
                                    await props.state.session.deleteFeed(
                                        source.id
                                    );
                                    deleteFeed(
                                        props.feedData,
                                        props.loadedData,
                                        props.filter,
                                        props.state,
                                        source?.title
                                    );
                                }}
                            />
                        ) : null}
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
                <input
                    onChange={(e) => {
                        setURL(e.target.value);
                    }}
                    type="text"
                    value={url}
                ></input>
                <button
                    onClick={() => {
                        addFeed(
                            url,
                            props.state,
                            props.feedData,
                            props.addFeedFail
                        );
                        setURL('');
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
