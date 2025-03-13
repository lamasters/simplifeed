import styles from '../styles/episode.module.css';
import { timeSince } from './card';

export default function Episode(props) {
    let description = props.episode.description;
    if (description.length > 250) {
        description = description.substring(0, 250) + '...';
    }
    const listenData = props.listenTimes.get(props.episode.$id) || [0, false];
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
            style={finished ? { color: 'gray' } : {}}
        >
            <div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'left',
                        width: '100%',
                        flexWrap: 'wrap',
                    }}
                >
                    <img
                        className={styles.cover}
                        src={props.episode.image_url}
                    />
                    <h3 className={styles.source}>
                        {props.episode.podcast_feed.feed_title}
                    </h3>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            marginRight: '20px',
                        }}
                    >
                        <h5>{timeSince(props.episode.pub_date)}</h5>
                        {listenText && (
                            <h5 style={{ marginLeft: '5px', color: '#48f' }}>
                                {listenText}
                            </h5>
                        )}
                    </div>
                    <div className={styles.control_container}>
                        <div
                            className={styles.control_button}
                            onClick={() => {
                                props.state.setPlaying(false);
                                props.state.setListenTime(listenTime || 0);
                                props.state.setPlaying(true);
                                props.state.setPodcast(props.episode);
                                navigator.mediaSession.metadata =
                                    new MediaMetadata({
                                        title: props.episode.title,
                                        artist: props.episode.podcast_feed
                                            .feed_title,
                                        artwork: [
                                            { src: props.episode.image_url },
                                        ],
                                    });
                            }}
                        >
                            Play
                        </div>
                        <div
                            className={styles.control_button}
                            onClick={() => {
                                props.state.setPlaying(false);
                                props.state.session
                                    .setPodcastFinished(props.episode.$id)
                                    .then();
                                const newListenTimes = new Map(
                                    props.listenTimes
                                );
                                newListenTimes.set(props.episode.$id, [
                                    0,
                                    true,
                                ]);
                                props.state.setListenTimes(newListenTimes);
                            }}
                        >
                            Mark as Played
                        </div>
                        <div className={styles.control_button}>
                            Add to Queue
                        </div>
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
