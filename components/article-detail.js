import { openArticleSource, returnToFeed } from '../util/feed-api';

import styles from '../styles/modal.module.css';

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
                        <img
                            className={styles.back_icon}
                            src="/chevron-left-solid.svg"
                            alt="Back"
                            height="24px"
                            width="24px"
                        />
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
