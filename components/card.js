import { selectArticle } from '../util/feed-api';
import styles from '../styles/card.module.css';

/**
 * Time since the article was published.
 * @param {Date} datetime - The datetime the article was published.
 * @returns {string} The time since the article was published.
 */
export function timeSince(datetime) {
    let d = new Date(datetime);
    let seconds = Math.floor((new Date() - d) / 1000);

    let interval = seconds / 31536000;

    if (interval > 1) {
        return (
            Math.floor(interval) +
            ` year${Math.floor(interval) === 1 ? '' : 's'} ago`
        );
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return (
            Math.floor(interval) +
            ` month${Math.floor(interval) === 1 ? '' : 's'} ago`
        );
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return (
            Math.floor(interval) +
            ` day${Math.floor(interval) === 1 ? '' : 's'} ago`
        );
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return (
            Math.floor(interval) +
            ` hour${Math.floor(interval) === 1 ? '' : 's'} ago`
        );
    }

    interval = seconds / 60;
    if (interval > 30) {
        return Math.floor(interval) + ' minutes ago';
    }
    return 'Just now';
}

/**
 * Renders a card component for displaying an article.
 *
 * @param {Object} props - The props for the card component.
 * @param {Object} props.article - The article object to be displayed.
 * @param {string} props.state - Hooks to set application state.
 * @returns {JSX.Element} The rendered card component.
 */
export default function Card(props) {
    let icon = '';
    if (!props.article.image) {
        let url = new URL(props.article.link);
        icon = (
            <img
                src={`https://www.google.com/s2/favicons?sz=64&domain=${url.origin}`}
                width={36}
                height={36}
                style={{
                    marginLeft: '10px',
                    marginRight: '10px',
                }}
            />
        );
    } else {
        icon = (
            <img
                src={props.article.image_url}
                width="24px"
                height="24px"
                style={{
                    borderRadius: '100%',
                    marginLeft: '10px',
                    marginRight: '10px',
                }}
            />
        );
    }
    return (
        <li
            onClick={() => {
                selectArticle(props.article, props.state);
            }}
            className={styles.item}
            key={props.article.title}
        >
            <div className={styles.itemHeader}>
                {icon}
                <div className={styles.itemTitle}>
                    <b>{props.article.source}</b>
                </div>
                <div className={styles.date}>
                    {timeSince(props.article.pub_date)}
                </div>
            </div>
            <div className={styles.info}>{props.article.title}</div>
        </li>
    );
}
