import { useEffect, useState } from 'react';

import Episode from './episode';
import { sortFeedItems } from './news-feed';
import styles from '../styles/feed.module.css';

function concatShows(sources) {
    let episodes = [];
    for (let source of sources) {
        episodes = episodes.concat(source.episodes);
    }
    return episodes;
}

export default function PodcastFeed(props) {
    const state = props.state;

    const [episodes, setEpisodes] = useState([]);

    useEffect(() => {
        if (props.podcastData.length > 0) {
            state.setShowTutorial(false);
            let list = concatShows(props.podcastData);
            sortFeedItems(list);
            if (props.filter == null) {
                setEpisodes(list);
            } else {
                setEpisodes(list.filter((item) => item.source == props.filter));
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
                    </ul>
                </div>
            </div>
        </>
    );
}
