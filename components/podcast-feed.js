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
    const hooks = props.hooks;
    const shows = props.hooks.podcastData.get();

    const [episodes, setEpisodes] = useState([]);

    useEffect(() => {
        if (shows.length > 0) {
            hooks.showTutorial.set(false);
            let list = concatShows(shows);
            console.log(list);
            sortFeedItems(list);
            setEpisodes(list);
        }
    }, [shows]);
    return (
        <div id={styles.feed_container} style={{ paddingBottom: '110px' }}>
            <div id={styles.feed_content}>
                {hooks.showTutorial.get() ? (
                    <div id={styles.tutorial}>
                        It's pretty quiet around here...
                    </div>
                ) : null}
                <ul style={{ width: '100%' }}>
                    {episodes.map((episode) => (
                        <>
                            <Episode episode={episode} hooks={props.hooks} />
                            <div
                                className={styles.divider}
                                key={episode.title + '_divider'}
                            ></div>
                        </>
                    ))}
                </ul>
            </div>
        </div>
    );
}
