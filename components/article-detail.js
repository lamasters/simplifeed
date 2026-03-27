import { openArticleSource, returnToFeed } from '../util/feed-api';

import styles from '../styles/article-detail.module.css';

/**
 * Renders the reader view - the clean, parsed text version of the full article.
 * This component displays the article content and provides navigation to summary or source.
 *
 * @param {Object} props - The props for the reader view component.
 * @param {string} props.articleContent - The content of the article.
 * @param {string} props.articleUrl - The original URL of the article.
 * @param {string} props.rawText - The raw text of the article.
 * @param {Object} props.state - Hooks to set application state.
 * @returns {JSX.Element} The rendered reader view component.
 */
export default function ArticleDetail(props) {
    return (
        <div>
            <div className={styles.article}>
                <div className={styles.readerHeader}>
                    <button
                        className={styles.readerBackBtn}
                        onClick={() => returnToFeed(props.state)}
                        aria-label="Back to feed"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 320 512"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z" />
                        </svg>
                    </button>
                    <span className={styles.readerTitle}>Reader View</span>
                    <button
                        className={styles.readerSourceBtn}
                        onClick={() => {
                            openArticleSource({
                                article_url: props.articleUrl,
                            });
                        }}
                        aria-label="Open source"
                    >
                        🌐
                    </button>
                </div>
                <div className={styles.articlecontent}>
                    {props.articleContent}
                </div>
            </div>
        </div>
    );
}
