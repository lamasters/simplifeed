import { downloadFeeds, fetchAndParseHtml } from "../util/rss";
import styles from "../styles/Home.module.css";

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

export async function fetchData(state) {
  state.setFeedList([]);
  let info = await state.session.getSession();
  if (info.$id == null) {
    state.router.push("/login");
  }

  let feeds = await state.session.getFeeds();
  if (feeds == null) {
    return;
  }

  if (feeds.length > 0) {
    state.setTutorial(null);
  }

  let feedData = await downloadFeeds(feeds);
  let sources = feedData.sources;
  let items = feedData.items.slice(0, 100);
  let feedList = sources.map((feed) => {
    return (
      <li
        onClick={() =>
          selectSource(
            feed.title,
            null,
            feeds,
            state.setOpacity,
            state.setArticleContent,
            state.setFilteredArticles
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
            await state.session.deleteFeed(feed.id);
            fetchData(state);
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
          state.setOpacity,
          state.setArticleContent,
          state.setFilteredArticles
        )
      }
      className={styles.source}
      key={"all"}
    >
      All Feeds
    </li>
  );
  state.setFeedList(feedList);
  state.setArticles(items);
  await selectSource(
    null,
    items,
    feeds,
    state.setOpacity,
    state.setArticleContent,
    state.setFilteredArticles
  );
}

export async function addFeed(url, state) {
  await state.session.createFeed(url);
  await fetchData(state);
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
          width="24px"
          height="24px"
          style={{ borderRadius: "100%", marginLeft: "10px", marginRight: "10px"}}
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
        <div className={styles.itemHeader}>{icon}<div className={styles.itemTitle}><b>{item.source.slice(0, 10)}</b></div><div className={styles.date}>{formatDate(item.pubDate)}</div></div>
        <div className={styles.info}>
          {item.title}
        </div>
      </li>
    );
  }
  setFilteredArticles(filteredArticles.slice(0, 100));
}
