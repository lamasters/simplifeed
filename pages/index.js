import 'react-toastify/dist/ReactToastify.css';

import { Slide, ToastContainer, toast } from 'react-toastify';
import { backgroundFetch, fetchNewsData } from '../util/feed-api';
import { useEffect, useMemo, useRef, useState } from 'react';

import ArticleDetail from '../components/article-detail';
import ArticleSummary from '../components/article-summary';
import { FETCH_INTERVAL } from '../util/constants';
import Head from 'next/head';
import NewsFeed from '../components/news-feed';
import NewsSidebar from '../components/news-sidebar';
import TopLoader from '../components/top-loader';
import { UserSession } from '../util/session';
import styles from '../styles/Home.module.css';
import { useRouter } from 'next/router';

export default function Home() {
    const [feedData, setFeedData] = useState([]);
    const [loadedData, setLoadedData] = useState([]);
    const [filter, setFilter] = useState(null);
    const [articleOpen, setArticleOpen] = useState(false);
    const [articleContent, setArticleContent] = useState(null);
    const [articleUrl, setArticleUrl] = useState(null);
    const [articleId, setArticleId] = useState(null);
    const [articleTitle, setArticleTitle] = useState(null);
    const [articleSource, setArticleSource] = useState(null);
    const [articleAuthor, setArticleAuthor] = useState(null);
    const [pubDate, setPubDate] = useState(null);
    const [showTutorial, setShowTutorial] = useState(true);
    const [collapse, setCollapse] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [activePanel, setActivePanel] = useState('feed'); // 'feed', 'sidebar'
    const [loading, setLoading] = useState(false);
    const [rawText, setRawText] = useState('');
    const [summary, setSummary] = useState('');
    const [viewMode, setViewMode] = useState('feed'); // 'feed', 'summary', 'reader'
    const [limit, setLimit] = useState(100);
    const [offset, setOffset] = useState(0);

    const fetchProcess = useRef();
    const addFeedFail = () =>
        toast.error('Failed to subscribe to feed', {
            position: 'bottom-center',
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'dark',
            transition: Slide,
        });
    const logoutFail = () =>
        toast.error('Failed to logout', {
            position: 'bottom-center',
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'dark',
            transition: Slide,
        });
    const infoToast = (msg) => {
        toast.info(msg, {
            position: 'bottom-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'dark',
            transition: Slide,
        });
    };
    const router = useRouter();

    const state = useMemo(() => {
        return {
            setArticleContent: setArticleContent,
            setArticleUrl: setArticleUrl,
            setArticleOpen: setArticleOpen,
            setArticleTitle: setArticleTitle,
            setArticleSource: setArticleSource,
            setArticleAuthor: setArticleAuthor,
            setPubDate: setPubDate,
            setFeedData: setFeedData,
            setFilter: setFilter,
            setLoadedData: setLoadedData,
            setLoading: setLoading,
            setRawText: setRawText,
            setShowTutorial: setShowTutorial,
            setCollapse: setCollapse,
            setLimit: setLimit,
            setOffset: setOffset,
            setArticleId: setArticleId,
            setSummary: setSummary,
            setViewMode: setViewMode,
            router: router,
            session: new UserSession(),
        };
    }, []);

    useEffect(() => {
        const updateIsMobile = () => {
            const mobile =
                window.innerWidth <= 768 ||
                window.innerHeight > window.innerWidth;
            setIsMobile(mobile);
            setActivePanel(mobile ? 'feed' : 'feed');
            setCollapse(mobile);
        };

        updateIsMobile();
        window.addEventListener('resize', updateIsMobile);

        const lastSection = localStorage.getItem('lastSection');
        if (lastSection === 'podcasts') {
            router.replace('/podcasts');
        }

        clearInterval(fetchProcess.current);
        setOffset(0);
        fetchNewsData(state, limit, 0, filter);
        fetchProcess.current = setInterval(
            () => backgroundFetch(state, filter),
            FETCH_INTERVAL
        );

        return () => {
            clearInterval(fetchProcess.current);
            window.removeEventListener('resize', updateIsMobile);
        };
    }, [state, limit, filter, router]);

    return (
        <main>
            <Head>
                <title>SimpliFeed</title>
                <link rel="icon" href="/favicon.ico" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <meta name="theme-color" content="#12151d" />
                <link rel="manifest" href="/manifest.json" />
                <link href="https://techhub.social/@masters" rel="me" />
            </Head>
            <div className={styles.main_container}>
                {isMobile ? (
                    activePanel === 'sidebar' ? (
                        <NewsSidebar
                            feedData={feedData}
                            loadedData={loadedData}
                            state={state}
                            filter={filter}
                            addFeedFail={addFeedFail}
                            logoutFail={logoutFail}
                            infoToast={infoToast}
                        />
                    ) : (
                        <NewsFeed
                            articleOpen={articleOpen}
                            feedData={feedData}
                            loadedData={loadedData}
                            filter={filter}
                            showTutorial={showTutorial}
                            state={state}
                            collapse={collapse}
                            limit={limit}
                            offset={offset}
                        />
                    )
                ) : (
                    <>
                        <NewsSidebar
                            feedData={feedData}
                            loadedData={loadedData}
                            state={state}
                            filter={filter}
                            addFeedFail={addFeedFail}
                            logoutFail={logoutFail}
                            infoToast={infoToast}
                        />
                        <NewsFeed
                            articleOpen={articleOpen}
                            feedData={feedData}
                            loadedData={loadedData}
                            filter={filter}
                            showTutorial={showTutorial}
                            state={state}
                            collapse={collapse}
                            limit={limit}
                            offset={offset}
                        />
                    </>
                )}
            </div>
            {loading && <TopLoader />}

            {isMobile && (
                <div className={styles.mobile_tabbar}>
                    <button
                        className={`${styles.tab_button} ${
                            activePanel === 'sidebar' ? styles.active_tab : ''
                        }`}
                        onClick={() => setActivePanel('sidebar')}
                    >
                        Sources
                    </button>
                    <button
                        className={`${styles.tab_button} ${
                            activePanel === 'feed' ? styles.active_tab : ''
                        }`}
                        onClick={() => setActivePanel('feed')}
                    >
                        Feed
                    </button>
                </div>
            )}

            {router.asPath.includes('summary') && (
                <ArticleSummary
                    articleTitle={articleTitle}
                    articleSource={articleSource}
                    articleUrl={articleUrl}
                    summary={summary}
                    state={state}
                    articleAuthor={articleAuthor}
                    pubDate={pubDate}
                />
            )}

            {router.asPath.includes('reader') && (
                <ArticleDetail
                    articleContent={articleContent}
                    articleUrl={articleUrl}
                    rawText={rawText}
                    state={state}
                    articleId={articleId}
                    summary={summary}
                />
            )}

            <ToastContainer />
        </main>
    );
}
