import AudioPlayer from 'react-h5-audio-player';
import { usePlayer } from './player-context';
import styles from '../styles/podcasts.module.css';
import { UserSession } from '../util/session';
import { useMemo } from 'react';

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
            <div className={styles.episode_info} style={{ position: 'fixed', bottom: '0px', left: '0px', zIndex: 1000, background: 'var(--background)', padding: '10px', borderRadius: '5px' }}>
                <h2 className={styles.episode_title} style={{ fontSize: '1rem', margin: 0 }}>
                    {podcast.podcast_feed.feed_title} - {podcast.title}
                </h2>
            </div>
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
                }}
                onEnded={onPodcastEnd}
                onLoadStart={() => setLoading(true)}
                onLoadedData={() => {
                    setLoading(false);
                    if (listenTime && audioPlayer.current) {
                        audioPlayer.current.audio.current.currentTime = listenTime;
                    }
                }}
                listenInterval={15000}
                onListen={() => {
                    if (audioPlayer.current) {
                        session
                            .setPodcastListenTime(
                                `${podcast.podcast_feed.feed_title} - ${podcast.title}`,
                                audioPlayer.current.audio.current.currentTime
                            )
                            .then();
                    }
                }}
            />
        </>
    );
}
