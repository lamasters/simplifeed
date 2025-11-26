import { getArticleSummary } from '../util/feed-api';
import styles from '../styles/modal.module.css';

/**
 * Renders a modal component for displaying an article.
 *
 * @param {Object} props - The props for the modal component.
 * @param {string} props.articleContent - The content of the article.
 * @param {string} props.rawText - The raw text of the article.
 * @param {string} props.articleId - The ID of the article
 * @param {Object} props.state - Hooks to set application state.
 * @param {string} props.summary - The summary of the article.
 * @returns {JSX.Element} The rendered modal component.
 */
export default function Modal(props) {
    return (
        <div>
            <div className={styles.article}>
                {props.rawText && !props.summary && (
                    <div
                        className={styles.summarize}
                        onClick={() => {
                            getArticleSummary(
                                props.state,
                                props.rawText,
                                props.articleId
                            );
                        }}
                    >
                        <div className={styles.summary_text}>✨ Summarize</div>
                    </div>
                )}
                {props.summary && (
                    <>
                        <h2 className={styles.ai_header}>AI Summary</h2>
                        <div className={styles.summary}>{props.summary}</div>
                    </>
                )}
                <div className={styles.articlecontent}>{props.articleContent}</div>
            </div>
            <div onClick={() => props.state.router.back()} className={styles.back}>
                <img
                    className={styles.back_icon}
                    src="/chevron-left-solid.svg"
                    alt="Back"
                    height="36px"
                    width="36px"
                />
            </div>
        </div>
    );
}
