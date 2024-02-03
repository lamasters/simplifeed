import styles from '../styles/modal.module.css';

export default function Modal(props) {
    return (
        <div>
            <div
                onClick={() => props.setArticleOpen(false)}
                id={styles.backdrop}
            ></div>
            <div id={styles.article}>
                <div id={styles.articlecontent}>{props.articleContent}</div>
            </div>
            <div onClick={() => props.setArticleOpen(false)} id={styles.close}>
                Close
            </div>
        </div>
    );
}
