import styles from "../styles/Home.module.css";
import Head from "next/head";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { UserSession } from "../util/session";
import { fetchData } from "../util/feed";
import Sidebar from "../components/sidebar";

export default function Home() {
  let session = new UserSession();
  const [feedList, setFeedList] = useState([]);
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]); // [source, articles
  const [url, setURL] = useState("");
  const [opacity, setOpacity] = useState(0.0);
  const [articleContent, setArticleContent] = useState(null);
  const [tutorial, setTutorial] = useState(
    <div id={styles.tutorial}>
      Add feeds to start seeing articles!
      <br />
      Try adding <em>https://www.linuxinsider.com/rss-feed</em>
    </div>
  );
  const [collapse, setCollapse] = useState(false);
  const router = useRouter();

  let state = {
    session: session,
    setFeedList: setFeedList,
    setArticles: setArticles,
    setFilteredArticles: setFilteredArticles,
    setOpacity: setOpacity,
    setArticleContent: setArticleContent,
    setTutorial: setTutorial,
    router: router,
  };

  const updateURL = (e) => {
    setURL(e.target.value);
  };

  useEffect(() => {
    setFilteredArticles(
      <img
        style={{ position: "absolute", left: "40%", top: "50%" }}
        src="/loader.gif"
        width="28px"
        height="28px"
      />
    );
    fetchData(state);
  }, []);
  return (
    <div>
      <Head>
        <title>SimpliFeed</title>
      </Head>
      <main>
        <Sidebar
          state={state}
          feedList={feedList}
          updateURL={updateURL}
          collapse={collapse}
        />
        <div
          onClick={() => {
            setCollapse(!collapse);
          }}
          id={styles.collapse}
        >
          <b>{collapse ? ">" : "<"}</b>
        </div>
        <div
          id={styles.articles}
          style={{
            width: collapse ? "90vw" : "calc(75vw - 50px)",
            left: collapse ? "5%" : undefined,
          }}
        >
          {tutorial}
          <ul style={{ width: "100%" }}>{filteredArticles}</ul>
        </div>
        {opacity ? (
          <div
            onClick={() => setOpacity(0.0)}
            id={styles.backdrop}
            style={{ opacity: opacity, width: String(100 * opacity) + "%" }}
          ></div>
        ) : null}
        {opacity ? (
          <div
            id={styles.article}
            style={{ opacity: opacity, width: String(95 * opacity) + "vw" }}
          >
            <div id={styles.articlecontent}>{articleContent}</div>
          </div>
        ) : null}
        {opacity ? (
          <div onClick={() => setOpacity(0.0)} id={styles.close}>
            Close
          </div>
        ) : null}
      </main>
    </div>
  );
}
