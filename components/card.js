import styles from '../styles/card.module.css';
import { selectArticle } from '../util/feed_api';

function formatDate(date) {
    let d = new Date(date);
    return d.toLocaleString();
}

export default function Card(props) {
    let icon = '';
    if (!props.article.image) {
        icon = <div className={styles.icon}>{props.article.source[0]}</div>;
    } else {
        icon = (
            <img
                src={props.article.image}
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
