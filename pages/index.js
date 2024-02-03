import styles from '../styles/Home.module.css';
import Head from 'next/head';

import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { UserSession } from '../util/session';
import { fetchData } from '../util/feed_api';
import Feed from '../components/feed';
import Loader from '../components/loader';
import Modal from '../components/modal';
import Sidebar from '../components/sidebar';

export default function Home() {
    let session = new UserSession();
    const [feedData, setFeedData] = useState([]);
    const [filter, setFilter] = useState(null);
    const [articleOpen, setArticleOpen] = useState(false);
    const [articleContent, setArticleContent] = useState(null);
    const [showTutorial, setShowTutorial] = useState(true);
    const [collapse, setCollapse] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    let state = useMemo(() => {
        return {
            session: session,
            setFeedData: setFeedData,
            setFilter: setFilter,
            setArticleOpen: setArticleOpen,
            setArticleContent: setArticleContent,
            setShowTutorial: setShowTutorial,
            setLoading: setLoading,
            router: router,
        };
    }, [session, router]);

    useEffect(() => {
        fetchData(state);
    }, []);
    return (
        <main>
            <Head>
                <title>SimpliFeed</title>
            </Head>
            <div className={styles.main_container}>
                {!collapse ? (
                    <Sidebar state={state} feedData={feedData} />
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
                    showTutorial={showTutorial}
                    feedData={feedData}
                    filter={filter}
                    state={state}
                />
            </div>
            {loading ? <Loader /> : null}
            {articleOpen ? (
                <Modal
                    setArticleOpen={setArticleOpen}
                    articleContent={articleContent}
                />
            ) : null}
        </main>
    );
}
