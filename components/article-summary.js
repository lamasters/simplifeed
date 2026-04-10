import {
    SUMMARY_FETCH_FAILED_MESSAGE,
    openArticleSource,
    openReaderView,
    retryArticleSummary,
    returnToFeed,
} from '../util/feed-api';
import { useEffect, useState } from 'react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from '../styles/article-summary.module.css';

/**
 * Loading phrases component that cycles through different messages
 */
function LoadingPhrases() {
    const phrases = [
        'Reading article...',
        'Digesting themes...',
        'Extracting points...',
        'Getting the gist...',
        'Crafting summary...',
        'Scanning the headlines...',
        'Connecting the dots...',
        'Polishing the highlights...',
        'Translating jargon...',
        'Trimming the fluff...',
        'Squashing the buzzwords...',
        'Reading between the lines...',
        'Rounding up the facts...',
    ];

    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(
        Math.floor(Math.random() * phrases.length)
    );
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);

            setTimeout(() => {
                setCurrentPhraseIndex(
                    Math.floor(Math.random() * phrases.length)
                );
                setIsVisible(true);
            }, 750);
        }, 2000);

        return () => clearInterval(interval);
    }, [phrases.length]);

    return (
        <div className={styles.loadingContainer}>
            <div
                className={`${styles.loadingText} ${isVisible ? styles.visible : styles.hidden}`}
            >
                {phrases[currentPhraseIndex]}
            </div>
        </div>
    );
}

/**
 * Renders the summary page for an article.
 *
 * @param {Object} props - The props for the summary component.
 * @param {string} props.articleTitle - The title of the article.
 * @param {string} props.articleSource - The source/feed name of the article.
 * @param {string} props.articleUrl - The original URL of the article.
 * @param {string} props.articleId - The article document ID.
 * @param {string} props.summary - The AI-generated summary of the article.
 * @param {Object} props.state - Hooks to set application state.
 * @param {string} props.articleAuthor - The article author.
 * @param {string} props.pubDate - The publication date.
 * @returns {JSX.Element} The rendered summary page component.
 */
export default function ArticleSummary(props) {
    const summaryFetchFailed = props.summary === SUMMARY_FETCH_FAILED_MESSAGE;

    return (
        <div className={styles.summaryModal}>
            <div className={styles.summaryContainer}>
                {/* Header */}
                <div className={styles.header}>
                    <button
                        className={styles.backBtn}
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
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>{props.articleTitle}</h1>
                        <p className={styles.source}>{props.articleSource}</p>
                    </div>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {summaryFetchFailed ? (
                        <div className={styles.errorState}>
                            <p className={styles.errorMessage}>
                                We could not load the summary right now.
                            </p>
                            <button
                                className={styles.retryBtn}
                                onClick={() =>
                                    retryArticleSummary(
                                        props.state,
                                        props.articleUrl,
                                        props.articleId
                                    )
                                }
                            >
                                Try Again
                            </button>
                        </div>
                    ) : props.summary ? (
                        <>
                            <h2 className={styles.summaryHeading}>
                                ✨ AI Summary
                            </h2>
                            <div className={styles.markdownContent}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        a: ({ href, children, ...rest }) => (
                                            <a
                                                {...rest}
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {children}
                                            </a>
                                        ),
                                    }}
                                >
                                    {props.summary}
                                </ReactMarkdown>
                            </div>
                        </>
                    ) : (
                        <LoadingPhrases />
                    )}
                </div>

                {/* Sticky Footer Action Bar */}
                <div className={styles.footer}>
                    <button
                        className={styles.footerBtn}
                        onClick={() => {
                            openReaderView(
                                props.state,
                                props.articleUrl,
                                props.articleTitle,
                                props.articleAuthor,
                                props.pubDate
                            );
                        }}
                    >
                        📖 Reader
                    </button>
                    <button
                        className={styles.footerBtn}
                        onClick={() => {
                            openArticleSource({
                                article_url: props.articleUrl,
                            });
                        }}
                    >
                        🌐 Source
                    </button>
                </div>
            </div>
        </div>
    );
}
