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
    const router = useRouter();

    let state = useMemo(() => {
        return {
            setArticleContent: setArticleContent,
            setArticleOpen: setArticleOpen,
            setFeedData: setFeedData,
            setFilter: setFilter,
            setLoading: setLoading,
            setShowTutorial: setShowTutorial,
            router: router,
            session: session,
        };
    }, [session, router]);

    useEffect(() => {
        fetchData(state);
    }, []);
    return (
        <main>
            <Head>
                <title>SimpliFeed</title>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="manifest" href="/manifest.json" />
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
                    feedData={feedData}
                    filter={filter}
                    showTutorial={showTutorial}
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
