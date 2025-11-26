import { useState, useMemo } from 'react';
import styles from '../styles/episode-details.module.css';

export default function EpisodeDetails({ episode, state, listenTimes, queue, setQueue }) {
    const [showMenu, setShowMenu] = useState(false);

    const listenData = listenTimes.get(
        `${episode.podcast_feed.feed_title} - ${episode.title}`
    ) || [0, false];
    const listenTime = listenData[0];
    const finished = listenData[1];

    const queuedIds = useMemo(
        () => queue.map((ep) => ep.$id),
        [queue]
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
        const key = `${episode.podcast_feed.feed_title} - ${episode.title}`;
        const newListenTimes = new Map(listenTimes);

        if (finished) {
            await state.session.setPodcastListenTime(key, 0);
            newListenTimes.set(key, [0, false]);
        } else {
            await state.session.setPodcastFinished(key);
            newListenTimes.set(key, [0, true]);
        }
        state.setListenTimes(newListenTimes);
    };

    const toggleQueue = (e) => {
        e.stopPropagation();
        if (!queuedIds.includes(episode.$id)) {
            setQueue(queue.concat([episode]));
        } else {
            setQueue((prev) => prev.filter((ep) => ep.$id !== episode.$id));
        }
        setShowMenu(false);
    };

    const playNext = (e) => {
        e.stopPropagation();
        setShowMenu(false);
        const newQueue = [episode].concat(queue);
        setQueue(newQueue);
    };

    const handlePlay = () => {
        state.setPlaying(false);
        state.setListenTime(listenTime || 0);
        state.setPlaying(true);
        state.setPodcast(episode);
        if (navigator.mediaSession) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: episode.title,
                artist: episode.podcast_feed.feed_title,
                artwork: [{ src: episode.image_url }],
            });
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className={styles.container}>
            <div className={styles.back_button} onClick={() => state.router.back()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
            </div>

            <div className={styles.content}>
                <img
                    src={episode.image_url}
                    alt={episode.title}
                    className={styles.cover_image}
                />

                <div className={styles.title}>{episode.title}</div>
                <div className={styles.podcast_name}>{episode.podcast_feed.feed_title}</div>
                <div className={styles.date}>{formatDate(episode.pub_date)}</div>
                {listenText && (
                    <div className={styles.listen_text} style={{ color: '#48f', marginBottom: '20px', marginTop: '-15px' }}>
                        {listenText}
                    </div>
                )}

                <div className={styles.controls}>
                    <div className={styles.play_button} onClick={handlePlay}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                        </svg>
                    </div>

                    <div className={styles.menu_container}>
                        <svg
                            className={styles.ellipsis_icon}
                            onClick={() => setShowMenu(!showMenu)}
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>

                        {showMenu && (
                            <div className={styles.dropdown_menu}>
                                <div className={styles.dropdown_item} onClick={togglePlayed}>
                                    {finished ? 'Mark as Unplayed' : 'Mark as Played'}
                                </div>
                                <div className={styles.dropdown_item} onClick={toggleQueue}>
                                    {queuedIds.includes(episode.$id) ? 'Remove from Queue' : 'Add to Queue'}
                                </div>
                                {!queuedIds.includes(episode.$id) && (
                                    <div className={styles.dropdown_item} onClick={playNext}>
                                        Play Next
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.description}>
                    {episode.description}
                </div>
            </div>
        </div>
    );
}
