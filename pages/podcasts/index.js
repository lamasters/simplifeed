import 'react-toastify/dist/ReactToastify.css';

import { Slide, ToastContainer, toast } from 'react-toastify';
import { useEffect, useMemo, useRef, useState } from 'react';

import AudioPlayer from 'react-h5-audio-player';
import Head from 'next/head';
import PodcastFeed from '../../components/podcast-feed';
import PodcastSidebar from '../../components/podcast-sidebar';
import TopLoader from '../../components/top-loader';
import { UserSession } from '../../util/session';
import base_styles from '../../styles/Home.module.css';
import { fetchPodcastData } from '../../util/feed-api';
import styles from '../../styles/podcasts.module.css';
import { useRouter } from 'next/router';

export default function Podcasts() {
    const [collapse, setCollapse] = useState(false);
    const [loading, setLoading] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [podcast, setPodcast] = useState('');
    const [podcastData, setPodcastData] = useState([]);
    const [loadedData, setLoadedData] = useState([]);
    const [filter, setFilter] = useState(null);
    const [showTutorial, setShowTutorial] = useState(true);
    const [listenTime, setListenTime] = useState(0);
    const [listenTimes, setListenTimes] = useState(new Map());
    const [limit, setLimit] = useState(100);
    const [offset, setOffset] = useState(0);

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
    const audioPlayer = useRef();

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
            session: new UserSession(),
        };
    }, [router]);

    const onPodcastEnd = () => {
        setPlaying(false);
        state.session.setPodcastFinished(podcast.$id).then();
        const newListenTimes = new Map(listenTimes);
        newListenTimes.set(podcast.$id, [0, true]);
        setListenTimes(newListenTimes);
    };

    useEffect(() => {
        if (window.innerHeight > window.innerWidth) {
            setCollapse(true);
        }
        fetchPodcastData(state);
    }, []);
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
                {!collapse && (
                    <PodcastSidebar
                        state={state}
                        podcastData={podcastData}
                        loadedData={loadedData}
                        filter={filter}
                        addPodcastFail={errorToast}
                        addPodcastToast={addPodcastToast}
                    />
                )}
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
                />
            </div>
            {playing && (
                <>
                    <div className={styles.episode_info}>
                        <h2 className={styles.episode_title}>
                            {podcast.podcast_feed.feed_title} - {podcast.title}
                        </h2>
                    </div>
                    <AudioPlayer
                        ref={audioPlayer}
                        showDownloadProgress={true}
                        showFilledProgress={true}
                        showJumpControls={true}
                        showFilledVolume={true}
                        loop={false}
                        autoPlay={true}
                        autoPlayAfterSrcChange={true}
                        src={podcast.audio_url}
                        style={{
                            position: 'fixed',
                            width: '100%',
                            bottom: '0px',
                        }}
                        onEnded={onPodcastEnd}
                        onLoadStart={() => setLoading(true)}
                        onLoadedData={() => {
                            setLoading(false);
                            if (listenTime) {
                                audioPlayer.current.audio.current.currentTime =
                                    listenTime;
                            }
                        }}
                        listenInterval={15000}
                        onListen={() => {
                            state.session
                                .setPodcastListenTime(
                                    podcast.$id,
                                    audioPlayer.current.audio.current
                                        .currentTime
                                )
                                .then();
                        }}
                    />
                </>
            )}
            {loading && <TopLoader />}
            <ToastContainer />
        </main>
    );
}
