import { useEffect, useState } from 'react';

import Episode from './episode';
import { loadMorePodcastData } from '../util/feed-api';
import styles from '../styles/feed.module.css';

const PAGE_SIZE = 100;

function filterPodcasts(podcastData, listenTimes, filter) {
    if (filter === 'unlistened') {
        return podcastData.filter((item) => {
            const listenTime = listenTimes.get(
                `${item.podcast_feed.feed_title} - ${item.title}`
            );
            return !listenTime || !listenTime[1];
        });
    }
    if (filter === 'continue') {
        return podcastData.filter((item) => {
            const listenTime = listenTimes.get(
                `${item.podcast_feed.feed_title} - ${item.title}`
            );
            return listenTime && listenTime[0] > 0;
        });
    }
    return podcastData.filter((item) => item.podcast_feed.$id === filter);
}

export default function PodcastFeed(props) {
    const state = props.state;

    const [episodes, setEpisodes] = useState([]);

    useEffect(() => {
        if (props.podcastData.length > 0) {
            state.setShowTutorial(false);
            if (props.filter == null) {
                setEpisodes(props.podcastData);
            } else {
                setEpisodes(
                    filterPodcasts(
                        props.podcastData,
                        props.listenTimes,
                        props.filter
                    )
                );
            }
        }
    }, [props.podcastData, props.filter]);
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
            <div id={styles.feed_container} style={{ paddingBottom: '110px' }}>
                <div id={styles.feed_content}>
                    {props.showTutorial && (
                        <div id={styles.tutorial}>
                            It's pretty quiet around here...
                        </div>
                    )}
                    <ul style={{ width: '100%' }}>
                        {episodes.map((episode) => (
                            <>
                                <Episode
                                    episode={episode}
                                    state={props.state}
                                    listenTimes={props.listenTimes}
                                />
                                <div
                                    className={styles.divider}
                                    key={episode.title + '_divider'}
                                ></div>
                            </>
                        ))}
                        {props.podcastData.length > 0 && (
                            <li
                                id={styles.load_more_card}
                                onClick={async () => {
                                    await loadMorePodcastData(
                                        props.state,
                                        props.podcastData,
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
