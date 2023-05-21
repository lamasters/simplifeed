import styles from "../styles/Home.module.css";
import Head from "next/head";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { downloadFeeds, fetchAndParseHtml } from "../util/rss";
import { UserSession } from "../util/session";

function formatDate(date) {
  let d = new Date(date);
  return d.toLocaleString();
}

async function selectArticle(article, setOpacity, setArticleContent) {
  setArticleContent("Loading...");
  setOpacity(1.0);
  let articleContent = await fetchAndParseHtml(article.link, article.title);
  setArticleContent(articleContent);
}

async function fetchData(
  session,
  setFeedList,
  setArticles,
  setFilteredArticles,
  setOpacity,
  setArticleContent,
  setTutorial,
  router
) {
  setFeedList([]);
  let info = await session.getSession();
  if (info.$id == null) {
    router.push("/login");
  }

  let feeds = await session.getFeeds();
  if (feeds == null) {
    return;
  }

  if (feeds.length > 0) {
    setTutorial(null);
  }

  let feedData = await downloadFeeds(feeds);
  let sources = feedData.sources;
  let items = feedData.items.slice(0, 50);
  let feedList = sources.map((feed) => {
    return (
      <li
        onClick={() =>
          selectSource(
            feed.title,
            null,
            feeds,
            setOpacity,
            setArticleContent,
            setFilteredArticles
          )
        }
        className={styles.source}
        key={feed.id}
      >
        <img
          id={styles.trash}
          src="/trash.png"
          width="28px"
          height="28px"
          onClick={async () => {
            await session.deleteFeed(feed.id);
            fetchData(
              session,
              setFeedList,
              setArticles,
              setFilteredArticles,
              setOpacity,
              setArticleContent,
              setTutorial,
              router
            );
          }}
        />
        {feed.title}
      </li>
    );
  });
  feedList.unshift(
    <li
      onClick={() =>
        selectSource(
          null,
          null,
          feeds,
          setOpacity,
          setArticleContent,
          setFilteredArticles
        )
      }
      className={styles.source}
      key={"all"}
    >
      All Feeds
    </li>
  );
  setFeedList(feedList);
  setArticles(items);
  await selectSource(
    null,
    items,
    feeds,
    setOpacity,
    setArticleContent,
    setFilteredArticles
  );
}

async function addFeed(
  session,
  url,
  setFeedList,
  setArticles,
  setFilteredArticles,
  setOpacity,
  setContent,
  setTutorial,
  router
) {
  await session.createFeed(url);
  await fetchData(
    session,
    setFeedList,
    setArticles,
    setFilteredArticles,
    setOpacity,
    setContent,
    setTutorial,
    router
  );
}

async function selectSource(
  source,
  articles,
  feeds,
  setOpacity,
  setArticleContent,
  setFilteredArticles
) {
  if (articles === null) {
    let feedData = await downloadFeeds(feeds);
    articles = feedData.items;
  }
  let filteredArticles = [];
  let count = 0;
  for (let item of articles) {
    if (source !== null && item.source !== source) {
      continue;
    }
    count++;
    let icon = "";
    if (item.image === null) {
      icon = <div className={styles.icon}>{item.source[0]}</div>;
    } else {
      icon = (
        <img
          src={item.image}
          width="40px"
          height="40px"
          style={{ borderRadius: "100%", marginLeft: "10px" }}
        />
      );
    }
    filteredArticles.push(
      <li
        onClick={() => {
          selectArticle(item, setOpacity, setArticleContent);
        }}
        className={styles.item}
        key={count}
      >
        {icon}
        <div className={styles.info}>
          <b>{item.source}</b> - {item.title}
        </div>
        <div className={styles.date}>{formatDate(item.pubDate)}</div>
      </li>
    );
  }
  setFilteredArticles(filteredArticles.slice(0, 50));
}

export default function Home() {
  let session = new UserSession();
  const [feedList, setFeedList] = useState([]);
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]); // [source, articles
  const [url, setURL] = useState("");
  const [reading, setReading] = useState(0.0);
  const [articleContent, setArticleContent] = useState(null);
  const [tutorial, setTutorial] = useState(
    <div id={styles.tutorial}>Add feeds to start seeing articles!</div>
  );
  const router = useRouter();

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
    fetchData(
      session,
      setFeedList,
      setArticles,
      setFilteredArticles,
      setReading,
      setArticleContent,
      setTutorial,
      router
    );
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
                  addFeed(
                    session,
                    url,
                    setFeedList,
                    setArticles,
                    setFilteredArticles,
                    setReading,
                    setArticleContent,
                    setTutorial,
                    router
                  );
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
          onClick={() => setReading(false)}
          id={styles.backdrop}
          style={{ opacity: reading, width: String(100 * reading) + "%" }}
        ></div>
        <div
          id={styles.article}
          style={{ opacity: reading, width: String(80 * reading) + "%" }}
        >
          <div id={styles.articlecontent}>{articleContent}</div>
        </div>
      </main>
    </div>
  );
}
