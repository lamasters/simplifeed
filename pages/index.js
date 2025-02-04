import 'react-toastify/dist/ReactToastify.css';

import { Slide, ToastContainer, toast } from 'react-toastify';
import { backgroundFetch, fetchNewsData } from '../util/feed-api';
import { useEffect, useMemo, useRef, useState } from 'react';

import { FETCH_INTERVAL } from '../util/constants';
import Head from 'next/head';
import Loader from '../components/loader';
import Modal from '../components/modal';
import NewsFeed from '../components/news-feed';
import NewsSidebar from '../components/news-sidebar';
import { UserSession } from '../util/session';
import styles from '../styles/Home.module.css';
import { useRouter } from 'next/router';

/**
 * Renders the Home page component.
 *
 * @returns {JSX.Element} The rendered Home component.
 */
export default function Home() {
    const [feedData, setFeedData] = useState([]);
    const [loadedData, setLoadedData] = useState([]);
    const [filter, setFilter] = useState(null);
    const [articleOpen, setArticleOpen] = useState(false);
    const [articleContent, setArticleContent] = useState(null);
    const [showTutorial, setShowTutorial] = useState(true);
    const [collapse, setCollapse] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rawText, setRawText] = useState('');
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
    const fetchFeedsFail = (feeds) => {
        toast.error(`Failed to update feeds:\n${feeds}`, {
            position: 'bottom-center',
            autoClose: 3000,
            hideProgressBar: true,
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
            setArticleOpen: setArticleOpen,
            setFeedData: setFeedData,
            setFilter: setFilter,
            setLoadedData: setLoadedData,
            setLoading: setLoading,
            setRawText: setRawText,
            setShowTutorial: setShowTutorial,
            setCollapse: setCollapse,
            router: router,
            session: new UserSession(),
        };
    }, [router]);

    useEffect(() => {
        clearInterval(fetchProcess.current);
        if (window.innerHeight > window.innerWidth) {
            setCollapse(true);
        }
        fetchNewsData(state, fetchFeedsFail);
        fetchProcess.current = setInterval(
            () => backgroundFetch(state),
            FETCH_INTERVAL
        );
    }, []);
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
                {!collapse && (
                    <NewsSidebar
                        feedData={feedData}
                        loadedData={loadedData}
                        state={state}
                        filter={filter}
                        addFeedFail={addFeedFail}
                        logoutFail={logoutFail}
                    />
                )}
                <NewsFeed
                    articleOpen={articleOpen}
                    feedData={feedData}
                    loadedData={loadedData}
                    filter={filter}
                    showTutorial={showTutorial}
                    state={state}
                    collapse={collapse}
                />
            </div>
            {loading && <Loader />}
            {articleOpen && (
                <Modal
                    articleContent={articleContent}
                    rawText={rawText}
                    state={state}
                />
            )}
            <ToastContainer />
        </main>
    );
}
