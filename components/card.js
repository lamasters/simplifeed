import { selectArticle } from '../util/feed-api';
import styles from '../styles/card.module.css';

/**
 * Formats a date into a localized string representation.
 * @param {Date} date - The date to be formatted.
 * @returns {string} The formatted date string.
 */
export function formatDate(date) {
    let d = new Date(date);
    return d.toLocaleString();
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
                    {formatDate(props.article.pub_date)}
                </div>
            </div>
            <div className={styles.info}>{props.article.title}</div>
        </li>
    );
}
