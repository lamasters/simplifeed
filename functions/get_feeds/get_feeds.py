"""Serverless Function to fetch articles from RSS feed"""

import enum
import http
import json
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

import requests
import bs4
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

THREADS = ThreadPoolExecutor(max_workers=10)


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
    item: bs4.element.Tag, source: str, image_url: Optional[str]
) -> ArticleMetadataRes:
    """Parse an article entry in RSS feed into ArticleMetadata"""
    title_item = item.find("title")
    link_item = item.find("link")
    pub_date_item = item.find("pubDate")

    if title_item is None or link_item is None:
        return ArticleMetadataRes(status=http.HTTPStatus.BAD_REQUEST)

    title = title_item.text
    link = link_item.text
    pub_date = pub_date_item.text if pub_date_item is not None else ""

    assert title is not None and link is not None and pub_date is not None
    return ArticleMetadataRes(
        data=ArticleMetadata(
            title=title.strip(),
            link=link,
            pub_date=pub_date,
            source=source.strip(),
            image_url=image_url,
        )
    )


def format_duration(duration):
    """Convert duration to human readable format"""
    try:
        duration = int(duration.text)
        return f"{duration // 60}:{duration % 60}"
    except ValueError:
        return duration.text


def parse_podcast_episode(
    item: bs4.element.Tag,
    source: str,
    image_url: Optional[str],
    author: Optional[str] = None,
) -> PodcastEpisodeRes:
    """Parse a podcast episode in RSS feed into PodcastEpisode"""
    title_item = item.find("title")
    audio_item = item.find("enclosure")
    description_item = item.find("description")
    pub_date_item = item.find("pubDate")
    if not author:
        authors_item = item.find("itunes:author")
    duration = item.find("itunes:duration")

    if title_item is None or audio_item is None:
        return PodcastEpisodeRes(status=http.HTTPStatus.BAD_REQUEST)

    title = title_item.text
    audio = audio_item.get("url")
    audio_type = audio_item.get("type")
    description = description_item.text if description_item is not None else ""
    pub_date = pub_date_item.text if pub_date_item is not None else ""
    authors = author if author is not None else authors_item.text
    duration = format_duration(duration) if duration is not None else "00:00"

    if description:
        soup = bs4.BeautifulSoup(description, "html.parser")
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
            authors=authors,
            duration=duration,
        )
    )


def fetch_article_source(rss_url: str) -> ArticleSourceRes:
    """Download news RSS feed and parse into ArticleSource"""
    rss_data = None
    res = requests.get(rss_url, timeout=30)
    rss_data = res.content

    if rss_data is None:
        return ArticleSourceRes(status=http.HTTPStatus.BAD_REQUEST)

    try:
        soup = bs4.BeautifulSoup(rss_data, "xml")
    except Exception:  # pylint: disable=broad-except
        return ArticleSourceRes(status=http.HTTPStatus.BAD_REQUEST)

    if not soup:
        return ArticleSourceRes(status=http.HTTPStatus.BAD_REQUEST)

    channel = soup.find("channel")
    if not channel:
        return ArticleSourceRes(status=http.HTTPStatus.BAD_REQUEST)

    articles: list[ArticleMetadata] = []
    image_url = ""
    title = ""
    if (title_tag := channel.find("title")) is not None:
        title = title_tag.text if title_tag.text is not None else ""
    if (image := channel.find("image")) is not None:
        url_tag = image.find("url")
        image_url = url_tag.text if url_tag is not None else None
    items = channel.find_all("item")
    for child in items:
        article_meta = parse_article_meta(child, title, image_url)
        if article_meta.status == http.HTTPStatus.OK and article_meta.data is not None:
            articles.append(article_meta.data)

    return ArticleSourceRes(
        data=ArticleSource(articles=articles, title=title.strip(), url=rss_url)
    )


def fetch_article_content(url: str) -> ArticleContentRes:
    """Download article content and parse into ArticleContent"""
    html_res = None
    res = requests.get(url, timeout=30)
    html_res = res.text
    if html_res is None:
        return ArticleContentRes(status=http.HTTPStatus.BAD_REQUEST)
    soup = bs4.BeautifulSoup(html_res, "html.parser")
    tags = soup.find_all("p")
    if not tags:
        return ArticleContentRes(status=http.HTTPStatus.BAD_REQUEST)
    return ArticleContentRes(data=ArticleContent(tags=[tag.text for tag in tags]))


def fetch_podcast_source(rss_url: str) -> PodcastSourceRes:
    """Download podcast RSS feed and parse into PodcastSource"""
    rss_data = None
    res = requests.get(rss_url, timeout=30)
    rss_data = res.content

    if rss_data is None:
        return PodcastSourceRes(status=http.HTTPStatus.BAD_REQUEST)

    try:
        soup = bs4.BeautifulSoup(rss_data, "xml")
    except Exception:  # pylint: disable=broad-except
        return PodcastSourceRes(status=http.HTTPStatus.BAD_REQUEST)

    if not soup:
        return PodcastSourceRes(status=http.HTTPStatus.BAD_REQUEST)

    channel = soup.find("channel")
    if not channel:
        return PodcastSourceRes(status=http.HTTPStatus.BAD_REQUEST)

    episodes: list[str] = []
    image_url = ""
    title = ""
    author = ""
    if (title_tag := channel.find("title")) is not None:
        title = title_tag.text if title_tag.text is not None else ""
    if (image := channel.find("image").find("url")) is not None:
        image_url = image.text if image.text is not None else None
    elif (image := channel.find("itunes:image").get("href")) is not None:
        image_url = image if image is not None else None
    if (author := channel.find("itunes:author")) is not None:
        author = author.text if author.text is not None else None

    items = channel.find_all("item")
    for child in items:
        episode_res = parse_podcast_episode(child, title, image_url, author)
        if episode_res.status == http.HTTPStatus.OK and episode_res.data is not None:
            episodes.append(episode_res.data)

    return PodcastSourceRes(
        data=PodcastSource(
            episodes=episodes, title=title.strip(), image_url=image_url, url=rss_url
        )
    )


def main(context):
    """Main function for the Cloud Function"""
    context.log("Starting parsing request")
    req_body = json.loads(context.req.body)
    context.log(f"Got request body {req_body}")
    req_data = ServerRequest(**req_body)

    res_data = None
    tasks = []
    try:
        if req_data.type == RequestType.SOURCE:
            context.log("Fetching article sources...")
            tasks = [
                fetch_article_source(url)
                for url in req_data.urls  # pylint: disable=not-an-iterable
            ]
        elif req_data.type == RequestType.ARTICLE:
            context.log("Fetching article content...")
            tasks = [
                fetch_article_content(url)
                for url in req_data.urls  # pylint: disable=not-an-iterable
            ]
        elif req_data.type == RequestType.PODCAST:
            context.log("Fetching podcast sources...")
            tasks = [
                fetch_podcast_source(url)
                for url in req_data.urls  # pylint: disable=not-an-iterable
            ]

        res_data = tasks
    except Exception as e:  # pylint: disable=broad-except
        context.log("Exception occurred fetching data")
        return context.res.json({"exception": str(e)})
    context.log("Finished fetching data")

    if not res_data:
        context.log("No data fetched")
        return context.res.json({"data": "Failed"})

    json_data = [jsonable_encoder(res) for res in res_data]
    context.log("Returning json data")
    return context.res.json({"data": json_data})
