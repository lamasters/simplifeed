import {
    fetchPodcastData,
    searchPodcastFeeds,
    subscribeToPodcastFeed,
} from '../util/feed-api';
import { useEffect, useState } from 'react';

import { Typeahead } from 'react-typeahead';
import styles from '../styles/sidebar.module.css';

function selectPodcastFeed(filter, state) {
    state.setFilter(filter);
    if (filter == 'continue' || filter == 'unlistened' || filter == 'queue') {
        fetchPodcastData(state, 100, 0, null);
    } else {
        fetchPodcastData(state, 100, 0, filter);
    }
}

async function deletePodcast(source, props) {
    props.state.setLoading(true);
    await props.state.session.deletePodcastSubscription(source.$id);
    await props.state.session.getSubscriptions();
    const newFeedData = props.podcastData.filter(
        (episode) => episode.podcast_feed.$id !== source.$id
    );
    const newLoadedData = props.loadedData.filter(
        (episode) => episode.podcast_feed.$id !== source.$id
    );
    props.state.setPodcastData(newFeedData);
    props.state.setLoadedData(newLoadedData);
    props.state.setLoading(false);
    if (props.filter === source.$id) {
        selectPodcastFeed(null, props.state);
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
    } else if (source.image_url) {
        return <img src={source.image_url} width="28px" height="28px" />;
    } else {
        return null;
    }
}

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
                <div className={styles.source_row} key="all">
                    <li
                        onClick={() => selectPodcastFeed(null, props.state)}
                        className={styles.source}
                        style={{ width: '100%' }}
                    >
                        All Podcasts
                    </li>
                </div>
                <div className={styles.source_row} key="queue">
                    <li
                        onClick={() => selectPodcastFeed('queue', props.state)}
                        className={styles.source}
                        style={{ width: '100%' }}
                    >
                        Queue
                    </li>
                </div>
                <div className={styles.source_row} key="continue">
                    <li
                        onClick={() =>
                            selectPodcastFeed('continue', props.state)
                        }
                        className={styles.source}
                        style={{ width: '100%' }}
                    >
                        Continue Listening
                    </li>
                </div>
                <div className={styles.source_row} key="unlistened">
                    <li
                        onClick={() =>
                            selectPodcastFeed('unlistened', props.state)
                        }
                        className={styles.source}
                        style={{ width: '100%' }}
                    >
                        New Episodes
                    </li>
                </div>
                {sortedPodcasts(subscriptions).map((feed) => (
                    <div className={styles.source_row} key={feed?.feed_title}>
                        {getPodcastIcon(feed, editing, props)}
                        <li
                            onClick={() =>
                                selectPodcastFeed(feed.$id, props.state)
                            }
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
            <button
                onClick={() => {
                    localStorage.setItem('lastSection', 'news');
                    props.state.router.push('/');
                }}
            >
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
