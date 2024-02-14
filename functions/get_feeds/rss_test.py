"""RSS Parser Test"""

import requests
from bs4 import BeautifulSoup
from get_feeds import fetch_article_source, fetch_podcast_source


def simple_request():
    """Basic request test"""
    page = requests.get("https://techcrunch.com/feed", timeout=30)
    soup = BeautifulSoup(page.content, "xml")

    channel = soup.find("channel")
    title = channel.find("title").text
    image_url = channel.find("image").find("url").text
    del image_url
    items = channel.find_all("item")
    item_tags = []

    for item in items:
        title = item.find("title").text
        link = item.find("link").text
        pub_date = item.find("pubDate").text
        item_tags.append(
            {
                "title": title,
                "link": link,
                "pub_date": pub_date,
            }
        )

    print(title)
    for item in item_tags:
        print(item["title"])
        print(item["link"])
        print(item["pub_date"])
        print("\n")

    print(items[0].prettify())
    print(type(items[0]))


def full_test():
    # print(fetch_podcast_source("https://rss.art19.com/the-headgum-podcast"))
    sources = [
        "https://9to5mac.com/feed/",
        "https://feeds.macrumors.com/MacRumors-All",
        "https://www.linuxinsider.com/rss-feed",
        "https://techcrunch.com/feed/",
        "https://feeds2.feedburner.com/androidcentral",
        "https://9to5google.com/feed/",
        "https://www.biopharmadive.com/feeds/news/",
        "https://app.newsloth.com/biospace-com/VlRQWw.rss",
        "https://app.newsloth.com/biospace-com/VlRQUg.rss",
        "https://www.ifixit.com/News/rss",
    ]
    for source in sources:
        print(source)
        res = fetch_article_source(source)
        print(res.data.title)


full_test()
