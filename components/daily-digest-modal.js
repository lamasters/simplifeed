import {
    SUMMARY_FETCH_FAILED_MESSAGE,
    getAvailableDigestDates,
    getDailyDigest,
    openArticleSource,
} from '../util/feed-api';
import { useEffect, useState } from 'react';

import articleCardStyles from '../styles/article-card.module.css';
import styles from '../styles/daily-digest-modal.module.css';

export default function DailyDigestModal({ isOpen, onClose, state, userId }) {
    const [digest, setDigest] = useState(null);
    const [availableDates, setAvailableDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedTopics, setExpandedTopics] = useState(new Set());

    useEffect(() => {
        if (isOpen && state) {
            loadAvailableDates();
        }
    }, [isOpen, state]);

    useEffect(() => {
        if (selectedDate && state && isOpen) {
            loadDigest(selectedDate);
        }
    }, [selectedDate, state, isOpen]);

    const loadAvailableDates = async () => {
        try {
            setLoading(true);
            const dates = await getAvailableDigestDates(state);
            setAvailableDates(dates);
            if (dates.length > 0) {
                setSelectedDate(dates[0]); // Select most recent by default
            }
            setError(null);
        } catch (err) {
            console.error('Failed to load available dates:', err);
            setError('Could not load available digests');
        } finally {
            setLoading(false);
        }
    };

    const loadDigest = async (date) => {
        try {
            setLoading(true);
            const digestData = await getDailyDigest(state, date);
            setDigest(digestData);
            setError(null);
        } catch (err) {
            console.error('Failed to load digest:', err);
            setError('Could not load digest for this date');
        } finally {
            setLoading(false);
        }
    };

    const toggleTopic = (index) => {
        const newExpanded = new Set(expandedTopics);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedTopics(newExpanded);
    };

    const openCitationSummary = async (citation) => {
        try {
            setLoading(true);
            state.setArticleOpen(true);
            state.setViewMode('summary');
            state.setArticleUrl(citation.url);
            state.setArticleId(citation.article_id || null);
            state.setArticleTitle(citation.title);
            state.setArticleSource(citation.feed_name);
            state.setArticleContent(null);
            state.setSummary('');
            state.setRawText('');
            state.router.push('#summary');

            const summary = await state.session.getSummary(
                citation.url,
                citation.article_id
            );

            state.setSummary(summary || SUMMARY_FETCH_FAILED_MESSAGE);
        } catch (err) {
            console.error('Failed to open citation summary:', err);
            state.setSummary(SUMMARY_FETCH_FAILED_MESSAGE);
        } finally {
            setLoading(false);
        }
    };

    const openCitationSource = (citation) => {
        openArticleSource({ article_url: citation.url });
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
                <h2>Daily Digest</h2>
                <button
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close digest"
                >
                    ×
                </button>
            </div>

            {availableDates.length > 0 && (
                <div className={styles.dateSelector}>
                    <label htmlFor="digest-date">Select Date:</label>
                    <select
                        id="digest-date"
                        value={selectedDate || ''}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={styles.dateSelect}
                    >
                        {availableDates.map((date) => (
                            <option key={date} value={date}>
                                {formatDate(date)}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className={styles.content}>
                {loading && (
                    <div className={styles.loading}>
                        <p>Loading digest...</p>
                    </div>
                )}

                {error && (
                    <div className={styles.error}>
                        <p>{error}</p>
                        {availableDates.length === 0 && (
                            <p className={styles.noDigestInfo}>
                                No digests available yet. Check back tomorrow!
                            </p>
                        )}
                    </div>
                )}

                {digest && !loading && (
                    <>
                        <div className={styles.digestMeta}>
                            <p>
                                Generated: {formatDateTime(digest.generated_at)}
                            </p>
                        </div>

                        <div className={styles.topics}>
                            {digest.topics && digest.topics.length > 0 ? (
                                digest.topics.map((topic, index) => (
                                    <div
                                        key={index}
                                        className={styles.topicCard}
                                    >
                                        <button
                                            className={styles.topicHeader}
                                            onClick={() => toggleTopic(index)}
                                        >
                                            <span className={styles.topicTitle}>
                                                {topic.topic}
                                            </span>
                                            <span
                                                className={
                                                    styles.expandIcon +
                                                    (expandedTopics.has(index)
                                                        ? ` ${styles.expanded}`
                                                        : '')
                                                }
                                            >
                                                ▼
                                            </span>
                                        </button>

                                        <div className={styles.topicSummary}>
                                            <p>{topic.summary}</p>
                                        </div>

                                        {expandedTopics.has(index) && (
                                            <div className={styles.citations}>
                                                <h4>Related Articles:</h4>
                                                {topic.citations &&
                                                topic.citations.length > 0 ? (
                                                    <ul>
                                                        {topic.citations.map(
                                                            (
                                                                citation,
                                                                citIndex
                                                            ) => (
                                                                <li
                                                                    key={
                                                                        citIndex
                                                                    }
                                                                >
                                                                    <div
                                                                        className={
                                                                            styles.citationCard
                                                                        }
                                                                    >
                                                                        <div
                                                                            className={
                                                                                styles.citationBody
                                                                            }
                                                                        >
                                                                            <span
                                                                                className={
                                                                                    styles.citationTitle
                                                                                }
                                                                            >
                                                                                {
                                                                                    citation.title
                                                                                }
                                                                            </span>
                                                                            <span
                                                                                className={
                                                                                    styles.citationFeed
                                                                                }
                                                                            >
                                                                                {
                                                                                    citation.feed_name
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div
                                                                            className={
                                                                                articleCardStyles.actionBar
                                                                            }
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                className={
                                                                                    articleCardStyles.actionBtn
                                                                                }
                                                                                onClick={() =>
                                                                                    openCitationSummary(
                                                                                        citation
                                                                                    )
                                                                                }
                                                                                title="Open summary"
                                                                            >
                                                                                ✨
                                                                                Summary
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className={
                                                                                    articleCardStyles.actionBtn
                                                                                }
                                                                                onClick={() =>
                                                                                    openCitationSource(
                                                                                        citation
                                                                                    )
                                                                                }
                                                                                title="Open original article"
                                                                            >
                                                                                🌐
                                                                                Source
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                ) : (
                                                    <p
                                                        className={
                                                            styles.noCitations
                                                        }
                                                    >
                                                        No citations available
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className={styles.noTopics}>
                                    No topics found in this digest
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}
