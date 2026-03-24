import { loadMoreNewsData, searchNewsArticles } from '../util/feed-api';
import { useCallback, useEffect, useRef, useState } from 'react';

import ArticleCard from './article-card';
import DailyDigestModal from './daily-digest-modal';
import styles from '../styles/feed.module.css';

const PAGE_SIZE = 100;

/**
 * Compares two feed objects and checks if their articles are equal.
 * @param {Object} a - The first feed object.
 * @param {Object} b - The second feed object.
 * @returns {boolean} - Returns true if the articles in the feeds are equal, otherwise returns false.
 */
function feedsEqual(a, b) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i].article_url !== b[i].article_url) return false;
    }
    return true;
}

/**
 * Creates an article list based on the provided feed data, filter, and sets the article list using the provided setter function.
 * @param {Array} feedData - The feed data containing articles from different sources.
 * @param {Function} setArticleList - The setter function to set the article list.
 */
function createArticleList(feedData, setArticleList) {
    let articles = feedData.copyWithin();
    setArticleList(articles);
}

/**
 * Renders a feed component.
 *
 * @param {Object} props - The component props.
 * @param {Array} props.feedData - The data for the feed.
 * @param {Array} props.loadedData - Feed data loaded in the background
 * @param {string} props.filter - The name of the source to display.
 * @param {boolean} props.showTutorial - Flag indicating whether to show the tutorial.
 * @param {Object} props.state - Hooks to set the application state.
 * @param {boolean} collapse -
 * @param {number} limit - The number of articles to load
 * @param {number} offset - The starting index to load from the database
 * @returns {JSX.Element} The rendered feed component.
 */
export default function NewsFeed(props) {
    const [articleList, setArticleList] = useState([]);
    const [seenTutorial, setSeenTutorial] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isDigestModalOpen, setIsDigestModalOpen] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const searchTimeoutRef = useRef(null);
    const abortControllerRef = useRef(null);
    useEffect(() => {
        if (localStorage.getItem('seenTutorial') !== null) {
            setSeenTutorial(true);
        } else {
            localStorage.setItem('seenTutorial', true);
        }
        if (isSearching && searchQuery.trim()) {
            setArticleList(searchResults);
        } else {
            createArticleList(props.feedData, setArticleList);
        }
    }, [props.feedData, searchResults, isSearching, searchQuery]);

    const handleSearch = useCallback(
        async (query) => {
            setSearchQuery(query);

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }

            if (query.trim()) {
                setIsSearching(true);

                // Debounce the search by 300ms
                searchTimeoutRef.current = setTimeout(async () => {
                    try {
                        abortControllerRef.current = new AbortController();
                        const results = await searchNewsArticles(
                            props.state,
                            query,
                            PAGE_SIZE,
                            0,
                            abortControllerRef.current.signal
                        );
                        setSearchResults(results);
                    } catch (error) {
                        if (error.name !== 'AbortError') {
                            console.error('Search error:', error);
                        }
                    }
                }, 300);
            } else {
                setIsSearching(false);
                setSearchResults([]);
            }
        },
        [props.state]
    );

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);
    const feedRef = useRef();
    return (
        <>
            <div id={styles.collapse_container}>
                <img
                    id={styles.collapse}
                    onClick={() => props.state.setCollapse(!props.collapse)}
                    src="/sidebar.svg"
                    width="30px"
                    height="30px"
                />
            </div>
            <div ref={feedRef} id={styles.feed_container}>
                <div id={styles.feed_content}>
                    <button
                        onClick={() => setIsDigestModalOpen(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            margin: 'auto',
                            marginBottom: '15px',
                            marginTop: '5px',
                            padding: '14px 18px',
                            borderRadius: '25px',
                            backgroundColor: 'var(--background-hover)',
                            color: 'var(--text-primary)',
                            fontSize: '18px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                                'var(--accent-primary-hover)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                                'var(--background-hover)';
                        }}
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                            ></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Daily Digest
                    </button>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            margin: 'auto',
                            marginBottom: '10px',
                            width: '90%',
                            padding: '0px',
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '10px',
                                marginTop: '0px',
                                marginBottom: '0px',
                                marginLeft: '8px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: 'var(--text-secondary)',
                                fontSize: '16px',
                                outline: 'none',
                                maxWidth: '100%',
                            }}
                        />
                    </div>
                    {props.showTutorial &&
                        (seenTutorial ? (
                            <div id={styles.tutorial}>
                                There's nothing here...
                            </div>
                        ) : (
                            <div id={styles.tutorial}>
                                Add feeds to start seeing articles!
                                <br />
                                Try adding{' '}
                                <em>https://www.linuxinsider.com/rss-feed</em>
                            </div>
                        ))}
                    {!feedsEqual(props.feedData, props.loadedData) &&
                        !props.filter &&
                        !props.articleOpen &&
                        !isSearching && (
                            <div
                                className={`${styles.update} ${styles.slide_bottom}`}
                                onClick={() => {
                                    props.state.setFeedData(props.loadedData);
                                    feedRef.current.scrollTo({
                                        top: 0,
                                        left: 0,
                                        behavior: 'smooth',
                                    });
                                }}
                            >
                                Get Latest
                            </div>
                        )}
                    <ul style={{ width: '100%' }}>
                        {articleList.map((article) => (
                            <>
                                <ArticleCard
                                    article={article}
                                    state={props.state}
                                />
                            </>
                        ))}
                        {props.feedData.length > 0 && !isSearching && (
                            <li
                                id={styles.load_more_card}
                                onClick={async () => {
                                    await loadMoreNewsData(
                                        props.state,
                                        props.feedData,
                                        props.limit,
                                        props.offset + PAGE_SIZE,
                                        props.filter
                                    );
                                    props.state.setOffset(
                                        props.offset + PAGE_SIZE
                                    );
                                }}
                            >
                                Load More
                            </li>
                        )}
                        {isSearching && searchResults.length >= PAGE_SIZE && (
                            <li
                                id={styles.load_more_card}
                                onClick={async () => {
                                    const moreResults =
                                        await searchNewsArticles(
                                            props.state,
                                            searchQuery,
                                            PAGE_SIZE,
                                            searchResults.length
                                        );
                                    setSearchResults([
                                        ...searchResults,
                                        ...moreResults,
                                    ]);
                                }}
                            >
                                Load More Search Results
                            </li>
                        )}
                    </ul>
                </div>
            </div>
            <DailyDigestModal
                isOpen={isDigestModalOpen}
                onClose={() => setIsDigestModalOpen(false)}
                state={props.state}
                userId={props.state.uid}
            />
        </>
    );
}
