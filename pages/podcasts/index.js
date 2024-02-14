import 'react-toastify/dist/ReactToastify.css';

import { Slide, ToastContainer, toast } from 'react-toastify';
import { useEffect, useMemo, useState } from 'react';

import Head from 'next/head';
import { Hook } from '../../util/session';
import Loader from '../../components/loader';
import PodcastFeed from '../../components/podcast-feed';
import { UserSession } from '../../util/session';
import base_styles from '../../styles/Home.module.css';
import { fetchPodcasts } from '../../util/feed-api';
import styles from '../../styles/podcasts.module.css';
import { useRouter } from 'next/router';

export default function Podcasts() {
    const session = new UserSession();

    const [collapse, setCollapse] = useState(false);
    const [loading, setLoading] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [podcast, setPodcast] = useState('');
    const [podcastData, setPodcastData] = useState([]);
    const [showTutorial, setShowTutorial] = useState(true);

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
    const router = useRouter();

    const hooks = useMemo(() => {
        return {
            collapse: new Hook(collapse, setCollapse),
            loading: new Hook(loading, setLoading),
            playing: new Hook(playing, setPlaying),
            podcast: new Hook(podcast, setPodcast),
            podcastData: new Hook(podcastData, setPodcastData),
            showTutorial: new Hook(showTutorial, setShowTutorial),
            errorToast: errorToast,
            router: router,
            session: session,
        };
    }, [
        collapse,
        loading,
        playing,
        podcast,
        podcastData,
        showTutorial,
        router,
        session,
    ]);

    useEffect(() => {
        fetchPodcasts(hooks);
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
                {collapse ? null : null}
                <div
                    onClick={() => {
                        setCollapse(!collapse);
                    }}
                    id={base_styles.collapse}
                >
                    <b>{collapse ? '>' : '<'}</b>
                </div>
                <PodcastFeed hooks={hooks} />
            </div>
            {playing ? (
                <>
                    <div className={styles.episode_info}>
                        <h2>
                            {podcast.source} - {podcast.title}
                        </h2>
                    </div>
                    <audio
                        controls
                        style={{
                            position: 'fixed',
                            width: '100%',
                            bottom: '0px',
                        }}
                        height="50"
                        src={podcast.audio}
                        autoPlay={true}
                    ></audio>
                </>
            ) : null}
            {loading ? <Loader /> : null}
            <ToastContainer />
        </main>
    );
}
