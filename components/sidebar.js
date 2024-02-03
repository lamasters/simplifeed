import { addFeed } from '../util/feed_api';
import styles from '../styles/sidebar.module.css';
import { useState } from 'react';

/**
 * Deletes a feed from the feedData array.
 * @param {Array} feedData - The array of feed data.
 * @param {Function} setFeedData - The function to update the feedData state.
 * @param {string} source - The title of the feed to be deleted.
 */
function deleteFeed(feedData, setFeedData, source) {
    const filtered = feedData.filter((feed) => feed.title !== source);
    setFeedData(filtered);
}

/**
 * Renders the sidebar component.
 *
 * @param {Object} props - The component props.
 * @returns {JSX.Element} The rendered sidebar component.
 */
export default function Sidebar(props) {
    const [url, setURL] = useState('');
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
                <li
                    onClick={() => props.state.setFilter(null)}
                    className={styles.source}
                    style={{ width: '100%' }}
                    key={0}
                >
                    All Feeds
                </li>
                {props.feedData.map((source) => (
                    <div className={styles.source_row}>
                        <img
                            id={styles.trash}
                            src="/trash.png"
                            width="28px"
                            height="28px"
                            onClick={async () => {
                                await props.state.session.deleteFeed(source.id);
                                deleteFeed(
                                    props.feedData,
                                    props.state.setFeedData,
                                    source.title
                                );
                            }}
                        />
                        <li
                            onClick={() => props.state.setFilter(source.title)}
                            className={styles.source}
                            key={source.title}
                        >
                            {source.title}
                        </li>
                    </div>
                ))}
            </ul>
            <div id={styles.add}>
                <input
                    onChange={(e) => {
                        setURL(e.target.value);
                    }}
                    type="text"
                    value={url}
                ></input>
                <button
                    onClick={() => {
                        addFeed(url, props.state, props.feedData);
                        setURL('');
                    }}
                    type="submit"
                >
                    Add Feed
                </button>
            </div>
            <button
                id={styles.logout}
                onClick={() => props.state.session.logout(props.state.router)}
            >
                Logout
            </button>
        </div>
    );
}
