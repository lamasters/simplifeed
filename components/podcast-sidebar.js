import { searchPodcastFeeds, subscribeToPodcastFeed } from '../util/feed-api';
import { useEffect, useState } from 'react';

import { Typeahead } from 'react-typeahead';
import styles from '../styles/sidebar.module.css';

async function deletePodcast(source, props) {
    props.state.setLoading(true);
    await props.state.session.deletePodcastSubscription(source.$id);
    await props.state.session.getSubscriptions();
    const newFeedData = props.podcastData.filter(
        (podcast) => podcast.podcastFeeds.$id !== source.$id
    );
    const newLoadedData = props.loadedData.filter(
        (podcast) => podcast.podcastFeeds.$id !== source.$id
    );
    props.state.setPodcastData(newFeedData);
    props.state.setLoadedData(newLoadedData);
    props.state.setLoading(false);
    if (props.filter === source.$id) {
        props.state.setFilter(null);
    }
}

function sortedPodcasts(podcastData) {
    let feedDataCopy = podcastData.slice();
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

function getPodcastIcon(source, editing, props) {
    if (editing) {
        return (
            <img
                id={styles.trash}
                src="/close.svg"
                width="24px"
                height="24px"
                onClick={async () => {
                    await deletePodcast(source, props);
                }}
            />
        );
    } else {
        return null;
    }
}

/**
 * Renders the sidebar component.
 *
 * @param {Object} props - The component props.
 * @returns {JSX.Element} The rendered sidebar component.
 */
export default function PodcastSidebar(props) {
    const [url, setURL] = useState('');
    const [editing, setEditing] = useState(false);
    const [feedOptions, setFeedOptions] = useState([]);
    const [displayOptions, setDisplayOptions] = useState([]);
    const [subscriptions, setSubscriptions] = useState(
        props.state.session.podcastSubscriptions
    );

    useEffect(() => {
        setSubscriptions(props.state.session.podcastSubscriptions);
    }, [props.state.session.podcastSubscriptions]);

    return (
        <div id={styles.sidebar}>
            <div id={styles.navbar}>
                <h1 className={styles.nav}>SimpliFeed</h1>
            </div>
            <h2>Podcasts</h2>
            <ul id={styles.feedlist}>
                <div className={styles.source_row}>
                    <li
                        onClick={() => props.state.setFilter(null)}
                        className={styles.source}
                        style={{ width: '100%' }}
                        key={0}
                    >
                        All Podcasts
                    </li>
                </div>
                {sortedPodcasts(subscriptions).map((feed) => (
                    <div className={styles.source_row} key={feed?.feed_title}>
                        {getPodcastIcon(feed, editing, props)}
                        <li
                            onClick={() => props.state.setFilter(feed?.$id)}
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
                <label>Search Podcasts</label>
                <Typeahead
                    options={displayOptions}
                    maxVisible={5}
                    onChange={async (e) => {
                        setURL(e.target.value);
                        let feeds = await searchPodcastFeeds(
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
                            subscribeToPodcastFeed(
                                feed.url,
                                props.state,
                                props.addPodcastFail,
                                props.addPodcastToast
                            );
                        }
                        setFeedOptions([]);
                        setDisplayOptions([]);
                    }}
                    customClasses={{
                        results: styles.search_results,
                        listItem: styles.search_item,
                    }}
                    placeholder={'Podcast name or RSS URL'}
                />
                <button
                    onClick={() => {
                        subscribeToPodcastFeed(
                            url,
                            props.state,
                            props.addPodcastFail,
                            props.addPodcastToast
                        );
                    }}
                    type="submit"
                >
                    Add Podcast
                </button>
            </div>
            <button onClick={() => props.state.router.push('/')}>
                Switch to News
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
