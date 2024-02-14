import { formatDate } from './card';
import styles from '../styles/episode.module.css';

async function episodeHash(title, source) {
    const data = new TextEncoder().encode(title + source);
    const hash = Array.from(
        new Uint8Array(crypto.subtle.digest('SHA-256', data))
    );
    return hash.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function Episode(props) {
    console.log(props.episode);
    let description = props.episode.description;
    if (description.length > 250) {
        description = description.substring(0, 250) + '...';
    }
    return (
        <li
            className={styles.episode}
            onClick={() => {
                props.hooks.playing.set(false);
                props.hooks.podcast.set(props.episode);
                props.hooks.playing.set(true);
            }}
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
                    <h3 className={styles.source}>{props.episode.source}</h3>
                    <h5>{formatDate(props.episode.pub_date)}</h5>
                </div>
                <div className={styles.episode_info}>
                    <h3>{props.episode.title}</h3>
                    <p className={styles.description}>{description}</p>
                </div>
            </div>
        </li>
    );
}
