import { sortFeedItems } from "../util/rss";
import styles from "../styles/Home.module.css";

function formatDate(date) {
  let d = new Date(date);
  return d.toLocaleString();
}

async function selectArticle(article, state) {
  state.setArticleContent("Loading...");
  state.setOpacity(1.0);
  let articleContent = await state.session.getArticle(article.link, article.title);
  state.setArticleContent(articleContent);
}

export async function fetchData(state) {
  state.setFeedList([]);
  let info = await state.session.getSession();
  if (info.$id == null) {
    state.router.push("/login");
  }

  let feedData = await state.session.getArticleSources();
  if (feedData === null) return;
  if (feedData.length > 0) state.setTutorial(null);
  let sources = feedData.sources;
  let items = sortFeedItems(feedData.items).slice(0, 100);
  let feedList = sources.map((feed) => {
    return (
      <li
        onClick={() =>
          selectSource(
            feed.title,
            null,
            state,
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
          state,
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
    state,
  );
}

export async function addFeed(url, state) {
  await state.session.createFeed(url);
  await fetchData(state);
}

async function selectSource(
  source,
  articles,
  state,
) {
  if (articles === null) {
    let feedData = await state.session.getArticleSources();
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
          style={{ borderRadius: "100%", marginLeft: "10px", marginRight: "10px" }}
        />
      );
    }
    filteredArticles.push(
      <li
        onClick={() => {
          selectArticle(item, state.setOpacity, state.setArticleContent);
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
  state.setFilteredArticles(filteredArticles.slice(0, 100));
}
