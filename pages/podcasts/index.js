import 'react-toastify/dist/ReactToastify.css';

import { Slide, ToastContainer, toast } from 'react-toastify';
import { useEffect, useMemo, useRef, useState } from 'react';

import EpisodeDetails from '../../components/episode-details';
import Head from 'next/head';
import PodcastFeed from '../../components/podcast-feed';
import PodcastSidebar from '../../components/podcast-sidebar';
import TopLoader from '../../components/top-loader';
import { UserSession } from '../../util/session';
import base_styles from '../../styles/Home.module.css';
import { fetchPodcastData } from '../../util/feed-api';
import styles from '../../styles/podcasts.module.css';
import { usePlayer } from '../../components/player-context';
import { useRouter } from 'next/router';

export default function Podcasts() {
    const [collapse, setCollapse] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [activePanel, setActivePanel] = useState('feed');
    const [podcastData, setPodcastData] = useState([]);
    const [loadedData, setLoadedData] = useState([]);
    const [filter, setFilter] = useState(null);
    const [showTutorial, setShowTutorial] = useState(true);
    const [listenTimes, setListenTimes] = useState(new Map());
    const [limit, setLimit] = useState(100);

    const [offset, setOffset] = useState(0);
    const [selectedEpisode, setSelectedEpisode] = useState(null);

    const {
        playing,
        setPlaying,
        podcast,
        setPodcast,
        setListenTime,
        loading,
        setLoading,
        queue,
        setQueue,
    } = usePlayer();

    const errorToast = (message) =>
        toast.error(message, {
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
    const addPodcastToast = (message) =>
        toast.info('Adding podcast feed... This may take a few minutes', {
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
    const router = useRouter();

    const session = useMemo(() => new UserSession(), []);

    const state = useMemo(() => {
        return {
            setFilter: setFilter,
            setLoading: setLoading,
            setPlaying: setPlaying,
            setPodcast: setPodcast,
            setPodcastData: setPodcastData,
            setLoadedData: setLoadedData,
            setShowTutorial: setShowTutorial,
            setListenTime: setListenTime,
            setListenTimes: setListenTimes,
            setCollapse: setCollapse,
            errorToast: errorToast,
            setLimit: setLimit,
            setOffset: setOffset,
            router: router,
            session: session,
        };
    }, [router, setLoading, setPlaying, setPodcast, setListenTime, session]);

    useEffect(() => {
        const updateIsMobile = () => {
            const mobile =
                window.innerWidth <= 768 ||
                window.innerHeight > window.innerWidth;
            setIsMobile(mobile);
            setActivePanel('feed');
            setCollapse(mobile);
        };

        updateIsMobile();
        window.addEventListener('resize', updateIsMobile);

        fetchPodcastData(state, limit, offset, filter);

        return () => {
            window.removeEventListener('resize', updateIsMobile);
        };
    }, [state, limit, offset, filter]);
    return (
        <main>
            <Head>
                <title>SimpliFeed | Podcasts</title>
                <link rel="icon" href="/favicon.ico" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <meta name="theme-color" content="#12151d" />
                <link rel="manifest" href="/manifest.json" />
            </Head>
            <div className={base_styles.main_container}>
                {isMobile ? (
                    activePanel === 'sidebar' ? (
                        <PodcastSidebar
                            state={state}
                            podcastData={podcastData}
                            loadedData={loadedData}
                            filter={filter}
                            addPodcastFail={errorToast}
                            addPodcastToast={addPodcastToast}
                        />
                    ) : (
                        <PodcastFeed
                            state={state}
                            podcastData={podcastData}
                            loadedData={loadedData}
                            filter={filter}
                            showTutorial={showTutorial}
                            listenTimes={listenTimes}
                            collapse={collapse}
                            limit={limit}
                            offset={offset}
                            queue={queue}
                            setQueue={setQueue}
                            podcast={podcast}
                            onEpisodeClick={setSelectedEpisode}
                        />
                    )
                ) : (
                    <>
                        <PodcastSidebar
                            state={state}
                            podcastData={podcastData}
                            loadedData={loadedData}
                            filter={filter}
                            addPodcastFail={errorToast}
                            addPodcastToast={addPodcastToast}
                        />
                        <PodcastFeed
                            state={state}
                            podcastData={podcastData}
                            loadedData={loadedData}
                            filter={filter}
                            showTutorial={showTutorial}
                            listenTimes={listenTimes}
                            collapse={collapse}
                            limit={limit}
                            offset={offset}
                            queue={queue}
                            setQueue={setQueue}
                            podcast={podcast}
                            onEpisodeClick={setSelectedEpisode}
                        />
                    </>
                )}
            </div>
            {router.asPath.includes('episode') && selectedEpisode && (
                <EpisodeDetails
                    episode={selectedEpisode}
                    state={state}
                    listenTimes={listenTimes}
                    queue={queue}
                    setQueue={setQueue}
                />
            )}
            {loading && <TopLoader />}

            {isMobile && (
                <div className={base_styles.mobile_tabbar}>
                    <button
                        className={`${base_styles.tab_button} ${
                            activePanel === 'sidebar'
                                ? base_styles.active_tab
                                : ''
                        }`}
                        onClick={() => setActivePanel('sidebar')}
                    >
                        Sources
                    </button>
                    <button
                        className={`${base_styles.tab_button} ${
                            activePanel === 'feed' ? base_styles.active_tab : ''
                        }`}
                        onClick={() => setActivePanel('feed')}
                    >
                        Feed
                    </button>
                </div>
            )}

            <ToastContainer />
        </main>
    );
}
