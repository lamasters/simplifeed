import styles from '../styles/episode.module.css';
import { timeSince } from './card';

export default function Episode(props) {
    let description = props.episode.description;
    if (description.length > 250) {
        description = description.substring(0, 250) + '...';
    }
    const listenData = props.listenTimes.get(
        `${props.episode.podcastFeeds.feed_title} - ${props.episode.title}`
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
                    artist: props.episode.podcastFeeds.feed_title,
                    artwork: [{ src: props.episode.image_url }],
                });
            }}
            style={finished ? { color: 'gray' } : {}}
        >
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
                        {props.episode.podcastFeeds.feed_title}
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
