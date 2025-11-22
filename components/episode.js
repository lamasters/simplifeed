import styles from '../styles/episode.module.css';
import { timeSince } from './card';
import { useState } from 'react';

export default function Episode(props) {
    const [showMenu, setShowMenu] = useState(false);
    let description = props.episode.description;
    if (description.length > 250) {
        description = description.substring(0, 250) + '...';
    }
    const listenData = props.listenTimes.get(
        `${props.episode.podcast_feed.feed_title} - ${props.episode.title}`
    ) || [0, false];
    const listenTime = listenData[0];
    const finished = listenData[1];

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
            await props.state.session.setPodcastListenTime(
                props.episode.title,
                0
            );
            newListenTimes.set(key, [0, false]);
        } else {
            await props.state.session.setPodcastFinished(props.episode.title);
            newListenTimes.set(key, [0, true]);
        }
        props.state.setListenTimes(newListenTimes);
    };

    return (
        <li
            className={styles.episode}
            onClick={() => {
                props.state.setPlaying(false);
                props.state.setListenTime(listenTime || 0);
                props.state.setPlaying(true);
                props.state.setPodcast(props.episode);
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: props.episode.title,
                    artist: props.episode.podcast_feed.feed_title,
                    artwork: [{ src: props.episode.image_url }],
                });
            }}
            style={finished ? { color: 'gray' } : {}}
        >
            <div
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 10,
                }}
            >
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
                    style={{
                        cursor: 'pointer',
                        padding: '5px',
                        borderRadius: '50%',
                        color: 'var(--accent-primary)',
                        backgroundColor: showMenu
                            ? 'rgba(255,255,255,0.1)'
                            : 'transparent',
                    }}
                >
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
                {showMenu && (
                    <div
                        style={{
                            position: 'absolute',
                            right: '0',
                            top: '30px',
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--background-hover)',
                            borderRadius: '5px',
                            padding: '5px 0',
                            width: '150px',
                            zIndex: 20,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
                        }}
                    >
                        <div
                            onClick={togglePlayed}
                            style={{
                                padding: '8px 15px',
                                cursor: 'pointer',
                                color: 'var(--text-paragraph)',
                                fontSize: '14px',
                            }}
                            onMouseEnter={(e) =>
                            (e.target.style.backgroundColor =
                                'var(--background-hover)')
                            }
                            onMouseLeave={(e) =>
                                (e.target.style.backgroundColor = 'transparent')
                            }
                        >
                            {finished ? 'Mark as Unplayed' : 'Mark as Played'}
                        </div>
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
                    }}
                >
                    <img
                        className={styles.cover}
                        src={props.episode.image_url}
                    />
                    <h3 className={styles.source}>
                        {props.episode.podcast_feed.feed_title}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <h5>{timeSince(props.episode.pub_date)}</h5>
                        {listenText && (
                            <h5 style={{ marginLeft: '5px', color: '#48f' }}>
                                {listenText}
                            </h5>
                        )}
                    </div>
                </div>
                <div className={styles.episode_info}>
                    <h3>{props.episode.title}</h3>
                    <p className={styles.description}>{description}</p>
                </div>
            </div>
        </li>
    );
}
