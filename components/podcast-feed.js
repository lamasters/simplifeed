import { useEffect, useRef, useState } from 'react';

import EpisodeCard from './episode-card';
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
    return podcastData;
}

export default function PodcastFeed(props) {
    const state = props.state;

    const [episodes, setEpisodes] = useState([]);
    const feedRef = useRef();

    useEffect(() => {
        if (props.podcastData.length > 0) {
            state.setShowTutorial(false);
            if (props.filter == null) {
                setEpisodes(props.podcastData);
            } else if (props.filter === 'queue') {
                setEpisodes(props.queue);
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
    }, [props.podcastData, props.filter, props.queue]);

    useEffect(() => {
        feedRef.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, [props.filter]);

    return (
        <div
            ref={feedRef}
            id={styles.feed_container}
            style={{ paddingBottom: '110px' }}
        >
            <div id={styles.feed_content}>
                {props.showTutorial && (
                    <div id={styles.tutorial}>
                        It's pretty quiet around here...
                    </div>
                )}
                <ul style={{ width: '100%' }}>
                    {episodes.map((episode) => (
                        <>
                            <EpisodeCard
                                episode={episode}
                                state={props.state}
                                listenTimes={props.listenTimes}
                                queue={props.queue}
                                setQueue={props.setQueue}
                                podcast={props.podcast}
                                onDescriptionClick={props.onEpisodeClick}
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
                                const serverFilter =
                                    props.filter === 'continue' ||
                                    props.filter === 'unlistened' ||
                                    props.filter === 'queue'
                                        ? null
                                        : props.filter;
                                await loadMorePodcastData(
                                    props.state,
                                    props.podcastData,
                                    props.limit,
                                    props.offset + PAGE_SIZE,
                                    serverFilter
                                );
                                props.state.setOffset(props.offset + PAGE_SIZE);
                            }}
                        >
                            Load More
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
