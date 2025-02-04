import { getArticleSummary } from '../util/feed-api';
import styles from '../styles/modal.module.css';
import { useState } from 'react';

/**
 * Renders a modal component for displaying an article.
 *
 * @param {Object} props - The props for the modal component.
 * @param {string} props.articleContent - The content of the article.
 * @param {string} props.rawText - The raw text of the article.
 * @param {Object} props.state - Hooks to set application state.
 * @returns {JSX.Element} The rendered modal component.
 */
export default function Modal(props) {
    const [summary, setSummary] = useState('');
    return (
        <div>
            <div
                onClick={() => props.state.setArticleOpen(false)}
                id={styles.backdrop}
            ></div>
            <div id={styles.article}>
                {props.rawText && (
                    <div
                        className={styles.summarize}
                        onClick={() => {
                            getArticleSummary(
                                props.state,
                                props.rawText,
                                setSummary
                            );
                        }}
                    >
                        <div className={styles.summary_text}>✨ Summarize</div>
                    </div>
                )}
                {summary && (
                    <>
                        <h2 className={styles.ai_header}>AI Summary</h2>
                        <div className={styles.summary}>{summary}</div>
                    </>
                )}
                <div id={styles.articlecontent}>{props.articleContent}</div>
            </div>
            <div
                onClick={() => props.state.setArticleOpen(false)}
                id={styles.close}
            >
                <img
                    id={styles.close_icon}
                    src="/close.svg"
                    alt="Close"
                    height="24px"
                    width="24px"
                />
            </div>
        </div>
    );
}
