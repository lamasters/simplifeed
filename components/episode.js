import { useMemo, useState } from 'react';

import styles from '../styles/episode.module.css';
import { timeSince } from './card';

export default function Episode(props) {
    const [showMenu, setShowMenu] = useState(false);
    const listenData = props.listenTimes.get(
        `${props.episode.podcast_feed.feed_title} - ${props.episode.title}`
    ) || [0, false];
    const listenTime = listenData[0];
    const finished = listenData[1];

    const queuedIds = useMemo(
        () => props.queue.map((episode) => episode.$id),
        [props.queue]
    );

    const formatListenTime = (seconds) => {
        if (seconds <= 0) {
            return '0:00';
        }
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const sec = Math.floor(seconds % 60);
        return `${hours}:${minutes.toString().padStart(2, '0')}:${sec
            .toString()
            .padStart(2, '0')}`;
    };

    let listenText = null;
    if (finished) {
        listenText = 'Finished';
    } else if (listenTime > 0) {
        listenText = `Continue from ${formatListenTime(listenTime)}`;
    }

    const togglePlayed = async (e) => {
        e.stopPropagation();
        setShowMenu(false);
        const key = `${props.episode.podcast_feed.feed_title} - ${props.episode.title}`;
        const newListenTimes = new Map(props.listenTimes);

        if (finished) {
            await props.state.session.setPodcastListenTime(key, 0);
            newListenTimes.set(key, [0, false]);
        } else {
            await props.state.session.setPodcastFinished(key);
            newListenTimes.set(key, [0, true]);
        }
        props.state.setListenTimes(newListenTimes);
    };

    return (
        <li
            className={styles.episode}
            style={finished ? { color: 'gray' } : {}}
        >
            <div className={styles.ellipsis_container}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="30px"
                    height="30px"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                    className={
                        showMenu
                            ? styles.ellipsis_icon_active
                            : styles.ellipsis_icon
                    }
                >
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
                {showMenu && (
                    <div className={styles.dropdown_menu}>
                        <div
                            onClick={togglePlayed}
                            className={styles.dropdown_item}
                        >
                            {finished ? 'Mark as Unplayed' : 'Mark as Played'}
                        </div>
                        <div
                            className={styles.dropdown_item}
                            onClick={() => {
                                if (
                                    !queuedIds.includes(props.episode.$id) &&
                                    props.podcast?.$id !== props.episode.$id
                                ) {
                                    props.setQueue(
                                        props.queue.concat([props.episode])
                                    );
                                } else {
                                    props.setQueue((prev) => {
                                        return prev.filter(
                                            (episode) =>
                                                episode.$id != props.episode.$id
                                        );
                                    });
                                }
                                setShowMenu(!showMenu);
                            }}
                        >
                            {queuedIds.includes(props.episode.$id)
                                ? 'Remove from Queue'
                                : 'Add to Queue'}
                        </div>
                        {!queuedIds.includes(props.episode.$id) && (
                            <div
                                className={styles.dropdown_item}
                                onClick={() => {
                                    if (
                                        !queuedIds.includes(
                                            props.episode.$id
                                        ) &&
                                        props.podcast?.$id !== props.episode.$id
                                    ) {
                                        props.setQueue(
                                            [props.episode].concat(props.queue)
                                        );
                                    }
                                    setShowMenu(!showMenu);
                                }}
                            >
                                Play Next
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'left',
                        width: '100%',
                        height: '50px',
                    }}
                >
                    <img
                        className={styles.cover}
                        src={props.episode.image_url}
                    />
                    <div className={styles.header_container}>
                        <h3 className={styles.title}>{props.episode.title}</h3>
                        <h3 className={styles.source}>
                            {props.episode.podcast_feed.feed_title}
                        </h3>
                    </div>
                </div>
                <div className={styles.episode_bottom_container}>
                    <p
                        className={styles.description}
                        onClick={() => {
                            props.state.selectEpisode(props.episode);
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        {props.episode.description}
                    </p>
                    <div
                        className={styles.play_button}
                        onClick={() => {
                            props.state.setPlaying(false);
                            props.state.setListenTime(listenTime || 0);
                            props.state.setPlaying(true);
                            props.state.setPodcast(props.episode);
                            navigator.mediaSession.metadata = new MediaMetadata(
                                {
                                    title: props.episode.title,
                                    artist: props.episode.podcast_feed
                                        .feed_title,
                                    artwork: [{ src: props.episode.image_url }],
                                }
                            );
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            width="48px"
                            height="48px"
                        >
                            <path d="M0 0h24v24H0z" fill="none" />
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                        </svg>
                    </div>
                </div>
                <div className={styles.episode_bottom_container}>
                    <h5 style={{ margin: '0', marginRight: '10px' }}>{timeSince(props.episode.pub_date)}</h5>
                    {listenText && (
                        <h5 style={{ marginLeft: '5px', color: '#48f', margin: '0' }}>
                            {listenText}
                        </h5>
                    )}
                </div>
            </div>
        </li>
    );
}
