import styles from "../styles/Home.module.css";
import Head from "next/head";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { UserSession } from "../util/session";
import { addFeed, fetchData } from "../util/feed";


export default function Home() {
  let session = new UserSession();
  const [feedList, setFeedList] = useState([]);
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]); // [source, articles
  const [url, setURL] = useState("");
  const [opacity, setOpacity] = useState(0.0);
  const [articleContent, setArticleContent] = useState(null);
  const [tutorial, setTutorial] = useState(
    <div id={styles.tutorial}>Add feeds to start seeing articles!</div>
  );
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
        <div id={styles.content}>
          <div id={styles.sidebar}>
            <div id={styles.navbar}>
              <img
                className={styles.nav}
                src="/simplifeed.png"
                width="64px"
                height="64px"
              />
              <h1 className={styles.nav}>SimpliFeed</h1>
            </div>
            <h2>Feeds</h2>
            <ul id={styles.feedlist}>{feedList}</ul>
            <div id={styles.add}>
              <input onChange={updateURL} type="text"></input>
              <button
                onClick={() => {
                  addFeed(url, state);
                }}
                type="submit"
              >
                Add Feed
              </button>
            </div>
            <button id={styles.logout} onClick={() => session.logout(router)}>
              Logout
            </button>
          </div>
          <div id={styles.articles}>
            {tutorial}
            <ul>{filteredArticles}</ul>
          </div>
        </div>
        <div
          onClick={() => setOpacity(false)}
          id={styles.backdrop}
          style={{ opacity: opacity, width: String(100 * opacity) + "%" }}
        ></div>
        <div
          id={styles.article}
          style={{ opacity: opacity, width: String(80 * opacity) + "%" }}
        >
          <div id={styles.articlecontent}>{articleContent}</div>
        </div>
      </main>
    </div>
  );
}
