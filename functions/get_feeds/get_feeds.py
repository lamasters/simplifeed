"""Serverless Function to fetch articles and podcasts from RSS feeds"""

import asyncio
import datetime
import enum
import http
import json
from concurrent.futures import ProcessPoolExecutor
from typing import Dict, Optional

import feedparser
import requests
from bs4 import BeautifulSoup
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field

from .article_models import (
    ArticleContent,
    ArticleContentRes,
    ArticleMetadata,
    ArticleMetadataRes,
    ArticleSource,
    ArticleSourceRes,
)
from .podcast_models import (
    PodcastEpisode,
    PodcastEpisodeRes,
    PodcastSource,
    PodcastSourceRes,
)

PROC_POOL = ProcessPoolExecutor()


class RequestType(enum.Enum):
    """Enum for client request types"""

    SOURCE = "source"
    ARTICLE = "article"
    PODCAST = "podcast"


class ServerRequest(BaseModel):
    """Model for client request to serverless function"""

    type: RequestType = Field(default=RequestType.SOURCE)
    urls: list[str] = Field(default_factory=list)


def parse_article_meta(
    item: Dict, source: str, image_url: Optional[str]
) -> ArticleMetadataRes:
    """Parse an article entry in RSS feed into ArticleMetadata"""
    title = item.get("title")
    link = item.get("link")
    pub_date = item.get("published", "")
    author = item.get("author")

    if title is None or link is None:
        return ArticleMetadataRes(status=http.HTTPStatus.BAD_REQUEST)

    return ArticleMetadataRes(
        data=ArticleMetadata(
            title=title.strip(),
            link=link,
            pub_date=pub_date,
            source=source.strip(),
            image_url=image_url,
            author=author,
        )
    )


def format_duration(duration):
    """Convert duration to human readable format"""
    try:
        duration = int(duration.text)
        return f"{duration // 60}:{duration % 60}"
    except ValueError:
        return "00:00"


def parse_podcast_episode(
    item: Dict,
    source: str,
    image_url: Optional[str],
    author: Optional[str] = None,
) -> PodcastEpisodeRes:
    """Parse a podcast episode in RSS feed into PodcastEpisode"""
    title = item.get("title")
    description = item.get("description")
    pub_date = item.get("published")
    for link in item.get("links"):
        if "audio" in link.get("type"):
            audio = link.get("href")
            audio_type = link.get("type")
            backup_duration = link.get("length")
            break
    duration = item.get("itunes_duration") or format_duration(backup_duration)

    if title is None or audio is None:
        return PodcastEpisodeRes(status=http.HTTPStatus.BAD_REQUEST)

    if description:
        soup = BeautifulSoup(description, "html.parser")
        description = soup.get_text(separator=" ")

    return PodcastEpisodeRes(
        data=PodcastEpisode(
            title=title.strip(),
            source=source.strip(),
            image_url=image_url,
            audio=audio,
            audio_type=audio_type,
            description=description,
            pub_date=pub_date,
            authors=author,
            duration=duration,
        )
    )


async def fetch_article_source(rss_url: str) -> ArticleSourceRes:
    """Download RSS feed and parse into ArticleSource"""
    try:
        loop = asyncio.get_event_loop()
        feed = await asyncio.wait_for(
            loop.run_in_executor(PROC_POOL, feedparser.parse, rss_url), timeout=5
        )
    except Exception:
        return ArticleSourceRes(
            status=http.HTTPStatus.BAD_REQUEST,
            message=f"Failed to parse RSS feed",
            data=ArticleSource(url=rss_url),
        )
    if not feed["entries"]:
        return ArticleSourceRes(
            status=http.HTTPStatus.BAD_REQUEST, message="No entries found in RSS feed"
        )

    feed_title = feed["feed"].get("title", "")
    image_url = ""
    if image := feed["feed"].get("image"):
        image_url = image.get("url", "")

    articles: list[ArticleMetadata] = []
    for entry in feed["entries"]:
        article_meta = parse_article_meta(entry, feed_title, image_url)
        if article_meta.status == http.HTTPStatus.OK and article_meta.data is not None:
            articles.append(article_meta.data)

    return ArticleSourceRes(
        data=ArticleSource(articles=articles, title=feed_title.strip(), url=rss_url)
    )


def fetch_article_content(url: str) -> ArticleContentRes:
    """Download article content and parse into ArticleContent"""
    html_res = None
    res = requests.get(url)
    html_res = res.text
    if html_res is None:
        return ArticleContentRes(status=http.HTTPStatus.BAD_REQUEST)
    soup = BeautifulSoup(html_res, "html.parser")
    tags = soup.find_all("p")
    if not tags:
        return ArticleContentRes(status=http.HTTPStatus.BAD_REQUEST)
    return ArticleContentRes(data=ArticleContent(tags=[tag.text for tag in tags]))


async def fetch_podcast_source(rss_url: str, log) -> PodcastSourceRes:
    """Download podcast RSS feed and parse into PodcastSource"""
    try:
        feed = feedparser.parse(rss_url)
    except Exception as e:
        log(f"Failed to parse RSS feed {rss_url} {e}")
        return PodcastSourceRes(
            status=http.HTTPStatus.BAD_REQUEST,
            message=f"Failed to parse RSS feed",
            data=PodcastSource(url=rss_url),
        )
    if not feed["entries"]:
        log("No entries found in RSS feed")
        return PodcastSourceRes(
            status=http.HTTPStatus.BAD_REQUEST,
            message="No entries found in RSS feed",
            data=PodcastSource(url=rss_url),
        )

    feed_title = feed["feed"].get("title", "").strip()
    image_url = ""
    if image := feed["feed"].get("image"):
        image_url = image.get("href", "")
    author = feed["feed"].get("author", "")
    log(f"Feed title: {feed_title}, Image URL: {image_url}, Author: {author}")

    episodes: list[str] = []
    for entry in feed["entries"]:
        episode_res = parse_podcast_episode(entry, feed_title, image_url, author)
        if episode_res.status == http.HTTPStatus.OK and episode_res.data is not None:
            episodes.append(episode_res.data)

    return PodcastSourceRes(
        data=PodcastSource(
            episodes=episodes, title=feed_title, image_url=image_url, url=rss_url
        )
    )


async def main(context):
    """Main function for the Cloud Function"""

    def log(message):
        context.log(f"{datetime.datetime.now().strftime('%H:%M:%S')}: {message}")

    log("Starting parsing request")
    req_body = json.loads(context.req.body)
    log(f"Got request body {req_body}")
    req_data = ServerRequest(**req_body)

    res_data = None
    tasks = []
    try:
        if req_data.type == RequestType.SOURCE:
            log("Fetching article sources...")
            tasks = [fetch_article_source(url) for url in req_data.urls]
            results = await asyncio.gather(*tasks)
        elif req_data.type == RequestType.ARTICLE:
            log("Fetching article content...")
            results = [fetch_article_content(url) for url in req_data.urls]
        elif req_data.type == RequestType.PODCAST:
            log("Fetching podcast sources...")
            tasks = [fetch_podcast_source(url, log) for url in req_data.urls]
            results = [await task for task in tasks]

        res_data = results
    except Exception as e:  # pylint: disable=broad-except
        log("Exception occurred fetching data")
        return context.res.json({"exception": str(e)})
    log("Finished fetching data")

    if not res_data:
        log("No data fetched")
        return context.res.json({"data": "Failed"})

    json_data = [jsonable_encoder(res) for res in res_data]
    log("Returning json data")
    return context.res.json({"data": json_data})
