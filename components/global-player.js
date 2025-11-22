import AudioPlayer from 'react-h5-audio-player';
import { usePlayer } from './player-context';
import styles from '../styles/podcasts.module.css';
import { UserSession } from '../util/session';
import { useMemo, useState } from 'react';

export default function GlobalPlayer() {
    const {
        playing,
        setPlaying,
        podcast,
        listenTime,
        setLoading,
        audioPlayer,
    } = usePlayer();

    const session = useMemo(() => new UserSession(), []);
    const [isMinimized, setIsMinimized] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    const onPodcastEnd = () => {
        setPlaying(false);
        session
            .setPodcastFinished(
                `${podcast.podcast_feed.feed_title} - ${podcast.title}`
            )
            .then();
    };

    if (!playing || !podcast) return null;

    return (
        <>
            <div
                className={styles.episode_info}
                style={{
                    position: 'fixed',
                    bottom: '0px',
                    left: '0px',
                    zIndex: 1000,
                    background: 'var(--background)',
                    padding: '10px',
                    borderRadius: '5px',
                    display: isMinimized ? 'none' : 'flex',
                }}
            >
                <h2
                    className={styles.episode_title}
                    style={{ fontSize: '1rem', margin: 0 }}
                >
                    {podcast.podcast_feed.feed_title} - {podcast.title}
                </h2>
                <button onClick={toggleMinimize} className={styles.toggle_button}>
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M6 9L12 15L18 9"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>
            {isMinimized && (
                <div
                    className={styles.minimized_player}
                    onClick={toggleMinimize}
                >
                    <div
                        className={styles.minimized_progress_bar}
                        style={{
                            width: `${(currentTime / duration) * 100}%`,
                        }}
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMinimize();
                        }}
                        className={styles.toggle_button}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M18 15L12 9L6 15"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            )}
            <AudioPlayer
                ref={audioPlayer}
                showDownloadProgress={true}
                showFilledProgress={true}
                showJumpControls={true}
                showFilledVolume={true}
                loop={false}
                autoPlay={true}
                autoPlayAfterSrcChange={true}
                src={podcast.audio_url}
                style={{
                    position: 'fixed',
                    width: '100%',
                    bottom: '0px',
                    zIndex: 1000,
                    background: 'var(--background)',
                    display: isMinimized ? 'none' : 'block',
                }}
                onEnded={onPodcastEnd}
                onLoadStart={() => setLoading(true)}
                onLoadedData={() => {
                    setLoading(false);
                    if (listenTime && audioPlayer.current) {
                        audioPlayer.current.audio.current.currentTime = listenTime;
                    }
                    if (audioPlayer.current) {
                        setDuration(audioPlayer.current.audio.current.duration);
                    }
                }}
                listenInterval={15000}
                onListen={() => {
                    if (audioPlayer.current) {
                        const current =
                            audioPlayer.current.audio.current.currentTime;
                        setCurrentTime(current);
                        session
                            .setPodcastListenTime(
                                `${podcast.podcast_feed.feed_title} - ${podcast.title}`,
                                current
                            )
                            .then();
                    }
                }}
            />
        </>
    );
}
