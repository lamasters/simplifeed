import 'react-toastify/dist/ReactToastify.css';

import { Slide, ToastContainer, toast } from 'react-toastify';
import { useEffect, useMemo, useState } from 'react';

import Feed from '../components/feed';
import Head from 'next/head';
import Loader from '../components/loader';
import Modal from '../components/modal';
import Sidebar from '../components/sidebar';
import { UserSession } from '../util/session';
import { fetchData } from '../util/feed_api';
import styles from '../styles/Home.module.css';
import { useRouter } from 'next/router';

/**
 * Renders the Home page component.
 *
 * @returns {JSX.Element} The rendered Home component.
 */
export default function Home() {
    let session = new UserSession();
    const [feedData, setFeedData] = useState([]);
    const [filter, setFilter] = useState(null);
    const [articleOpen, setArticleOpen] = useState(false);
    const [articleContent, setArticleContent] = useState(null);
    const [showTutorial, setShowTutorial] = useState(true);
    const [collapse, setCollapse] = useState(false);
    const [loading, setLoading] = useState(false);
    const [proUser, setProUser] = useState(false);
    const [rawText, setRawText] = useState('');
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
    const router = useRouter();

    let state = useMemo(() => {
        return {
            setArticleContent: setArticleContent,
            setArticleOpen: setArticleOpen,
            setFeedData: setFeedData,
            setFilter: setFilter,
            setLoading: setLoading,
            setProUser: setProUser,
            setRawText: setRawText,
            setShowTutorial: setShowTutorial,
            router: router,
            session: session,
        };
    }, [session, router]);

    useEffect(() => {
        if (window.innerHeight > window.innerWidth) {
            setCollapse(true);
        }
        fetchData(state);
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
            </Head>
            <div className={styles.main_container}>
                {!collapse ? (
                    <Sidebar
                        state={state}
                        feedData={feedData}
                        addFeedFail={addFeedFail}
                        logoutFail={logoutFail}
                    />
                ) : null}
                <div
                    onClick={() => {
                        setCollapse(!collapse);
                    }}
                    id={styles.collapse}
                >
                    <b>{collapse ? '>' : '<'}</b>
                </div>
                <Feed
                    feedData={feedData}
                    filter={filter}
                    showTutorial={showTutorial}
                    state={state}
                />
            </div>
            {loading ? <Loader /> : null}
            {articleOpen ? (
                <Modal
                    articleContent={articleContent}
                    proUser={proUser}
                    rawText={rawText}
                    state={state}
                />
            ) : null}
            <ToastContainer />
        </main>
    );
}
