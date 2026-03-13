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
    ];

    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);

            setTimeout(() => {
                setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
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
                        <img
                            src="/chevron-left-solid.svg"
                            alt="Back"
                            height="24px"
                            width="24px"
                        />
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
