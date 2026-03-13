import {
    openArticleSource,
    openReaderView,
    returnToFeed,
} from '../util/feed-api';
import { useEffect, useState } from 'react';

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

    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);

            setTimeout(() => {
                setCurrentPhraseIndex(
                    Math.floor(Math.random() * phrases.length)
                );
                setIsVisible(true);
            }, 500);
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
 * @param {string} props.summary - The AI-generated summary of the article.
 * @param {Object} props.state - Hooks to set application state.
 * @param {string} props.articleAuthor - The article author.
 * @param {string} props.pubDate - The publication date.
 * @returns {JSX.Element} The rendered summary page component.
 */
export default function ArticleSummary(props) {
    const summaryPoints = props.summary
        ? props.summary
              .split('\n')
              .filter((line) => line.trim() !== '')
              .map((line) => line.replace(/^[-•*]\s*/, '').trim())
        : [];

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
                    {props.summary ? (
                        <>
                            <h2 className={styles.summaryHeading}>
                                ✨ AI Summary
                            </h2>
                            <div className={styles.summaryList}>
                                {summaryPoints.map((point, index) => (
                                    <p
                                        key={index}
                                        className={styles.summaryPoint}
                                    >
                                        {point}
                                    </p>
                                ))}
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
