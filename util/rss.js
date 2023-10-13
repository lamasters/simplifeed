function feedSource(title, description, items) {
  return {
    title: title,
    description: description,
    id: 0,
    items: items,
  };
}

function feedItem(
  title,
  link,
  pubDate,
  source,
  imageURL,
  setArticle
) {
  return {
    title: title,
    link: link,
    pubDate: pubDate,
    source: source,
    image: imageURL,
    setArticle: function () {
      setArticle(this);
    },
  };
}


function parseFeed(feed) {
  let feedItems = [];
  console.log(feed);
  for (let item of feed.articles) {
    let url = null;
    if (
      typeof feed.image !== "undefined"
    ) {
      url = feed.image;
    }
    feedItems.push(
      feedItem(
        item.title,
        item.link,
        item.pubDate,
        feed.title,
        url
      )
    );
  }
  return feedItems;
}

function getDate(pubDate) {
  let date = new Date(pubDate);
  return date.getTime();
}

export function sortFeedItems(feedItems) {
  feedItems.sort((a, b) => {
    let dateA = getDate(a.pubDate);
    let dateB = getDate(b.pubDate);

    if (dateA > dateB) {
      return -1;
    }
    if (dateA < dateB) {
      return 1;
    }
    return 0;
  });
}

export async function downloadFeed(url, tries = 0) {
  const CORS_PROXY = "https://www.simplifeed.org/api/?url=";
  url = url.replace("https://", "");
  let res = await fetch(CORS_PROXY + url);
  let json = await res.json();

  if (typeof json.articles === "undefined") {
    if (tries < 3) {
      setTimeout(() => {
        downloadFeed(url, tries + 1);
      }, 500);
    }
    return null;
  }
  let feedItems = parseFeed(json);

  return feedSource(
    json.title,
    json.description,
    feedItems
  );
}

export async function downloadFeeds(urls) {
  let feedSources = [];
  let feedItems = [];
  for (let url of urls) {
    let feedObj = await downloadFeed(url.url);
    if (feedObj == null) {
      continue;
    }
    feedObj.id = url.$id;
    feedSources.push(feedObj);
    feedItems = feedItems.concat(feedObj.items);
  }

  sortAllFeedItems(feedItems);

  return {
    sources: feedSources,
    items: feedItems,
  };
}

export async function fetchAndParseHtml(url, title) {
  const CORS_PROXY = "https://www.simplifeed.org/proxy/?url=";
  url = url.replace("https://", "");
  let response;
  try {
    response = await fetch(CORS_PROXY + url);
  } catch (err) {
    console.error(err);
    return (
      <a href={`//${url}`} target="_blank">
        Click here to view content
      </a>
    );
  }
  const tags = await response.json();
  let content = [
    <a
      href={`//${url}`}
      target="_blank"
      style={{ color: "blue", textDecoration: "underline" }}
    >
      View original content
    </a>,
    <br />,
    <h1 style={{ textAlign: "center", margin: "10px" }}>{title}</h1>,
    <br />,
  ];
  for (let tag of tags.tags) {
    content.push(<p>{tag}</p>);
    content.push(<br />);
  }
  for (let i = 0; i < 15; i++) {
    content.push(<br />);
  }
  return <div>{content}</div>;
}
