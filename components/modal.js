import styles from '../styles/modal.module.css';

/**
 * Renders a modal component for displaying an article.
 *
 * @param {Object} props - The props for the modal component.
 * @param {boolean} props.setArticleOpen - A function to set the article open state.
 * @param {string} props.articleContent - The content of the article.
 * @returns {JSX.Element} The rendered modal component.
 */
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
