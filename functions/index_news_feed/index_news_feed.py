"""Serverless Function to fetch articles and podcasts from RSS feeds"""

import datetime
import http
import json
import os
from hashlib import md5
from typing import Callable, Dict, Optional

import feedparser
from appwrite.client import Client
from appwrite.services.databases import Databases
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field


PROJECT_ID = "67cccd44002cccfc9ae0"
FEEDS_DATABASE_ID = "6466af38420c3ca601c1"
NEWS_FEEDS_COLLECTION_ID = "6797ac1d0029e18b03da"
NEWS_ARTICLES_COLLECTION_ID = "6797ac2e001706792636"


class ServerRequest(BaseModel):
    """Model for client request to serverless function"""

    feed_id: str = Field(...)


class Article(BaseModel):
    """Model for an article entry in home feed"""

    title: str = Field(...)
    article_url: str = Field(...)
    news_feed: str = Field(...)
    newsFeeds: str = Field(...)
    pub_date: Optional[str] = Field(default=None)
    image_url: Optional[str] = Field(default=None)
    author: Optional[str] = Field(default=None)


def parse_news_article(
    item: Dict,
    databases: Databases,
    feed_id: str,
    image_url: Optional[str],
) -> http.HTTPStatus:
    """Parse an article entry in RSS feed into ArticleMetadata"""
    title = item.get("title")
    article_url = item.get("link")
    pub_date = item.get("published", "")
    author = item.get("author")

    if title is None or article_url is None:
        return http.HTTPStatus.INTERNAL_SERVER_ERROR

    title = title.strip()
    if "<" and ">" in title:
        soup = BeautifulSoup(title, "html.parser")
        title = soup.get_text(separator=" ")

    article = Article(
        title=title,
        article_url=article_url,
        news_feed=feed_id,
        newsFeeds=feed_id,
        pub_date=pub_date,
        image_url=image_url,
        author=author,
    )
    document_id = md5(article_url.encode()).hexdigest()
    try:
        databases.create_document(
            FEEDS_DATABASE_ID,
            NEWS_ARTICLES_COLLECTION_ID,
            document_id,
            article.model_dump(exclude_none=True),
        )
    except:
        return http.HTTPStatus.CONFLICT
    return http.HTTPStatus.OK


def fetch_article_source(
    rss_url: str, databases: Databases, feed_id: str, log: Callable
) -> http.HTTPStatus:
    """Download RSS feed and parse into ArticleSource"""
    log(f"Fetching RSS feed {rss_url}")
    try:
        feed = feedparser.parse(rss_url)
    except Exception:
        log(f"Failed to parse RSS feed {rss_url}")
        return http.HTTPStatus.INTERNAL_SERVER_ERROR
    if not feed["entries"]:
        log(f"No entries found in RSS feed {rss_url}")
        return http.HTTPStatus.INTERNAL_SERVER_ERROR

    log(f"Found {len(feed['entries'])} entries in RSS feed {rss_url}")
    image_url = None
    if image := feed["feed"].get("image"):
        image_url = image.get("url")

    article_responses = []
    for entry in feed["entries"]:
        res = parse_news_article(entry, databases, feed_id, image_url)
        article_responses.append(res)

    if all(res == http.HTTPStatus.INTERNAL_SERVER_ERROR for res in article_responses):
        return http.HTTPStatus.INTERNAL_SERVER_ERROR
    elif any(res == http.HTTPStatus.INTERNAL_SERVER_ERROR for res in article_responses):
        return http.HTTPStatus.PARTIAL_CONTENT
    elif all(res == http.HTTPStatus.CONFLICT for res in article_responses):
        return http.HTTPStatus.CONFLICT
    return http.HTTPStatus.OK


def main(context):
    """Main entry point for the news feed parsing serverless function"""

    def log(message):
        context.log(f"{datetime.datetime.now().strftime('%H:%M:%S')}: {message}")

    log("Starting parsing request")
    req_body = json.loads(context.req.body)
    log(f"Got request body {req_body}")
    req_data = ServerRequest(**req_body)

    client = Client()
    client.set_key(os.getenv("APPWRITE_API_KEY"))
    client.set_endpoint("https://cloud.appwrite.io/v1")
    client.set_project(PROJECT_ID)

    databases = Databases(client)

    log("Fetching article feed...")
    try:
        feed_res = databases.get_document(
            FEEDS_DATABASE_ID, NEWS_FEEDS_COLLECTION_ID, req_data.feed_id
        )
    except Exception as e:
        log(f"Failed to fetch feed document {req_data.feed_id} {e}")
        return context.res.json(
            {"message": str(e)}, statusCode=http.HTTPStatus.INTERNAL_SERVER_ERROR
        )
    try:
        res = fetch_article_source(
            feed_res["rss_url"], databases, req_data.feed_id, log
        )
    except Exception as e:  # pylint: disable=broad-except
        log(f"Exception occurred fetching data {e}")
        return context.res.json(
            {"message": str(e)},
            statusCode=http.HTTPStatus.INTERNAL_SERVER_ERROR,
        )

    databases.update_document(
        FEEDS_DATABASE_ID,
        NEWS_FEEDS_COLLECTION_ID,
        req_data.feed_id,
        {
            "last_update": datetime.datetime.now(tz=datetime.timezone.utc).strftime(
                "%Y-%m-%dT%H:%M:%S.%f%z"
            )
        },
    )
    log("Finished fetching data")
    return context.res.json({}, statusCode=res)
