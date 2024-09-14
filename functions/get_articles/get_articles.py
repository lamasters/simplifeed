"""Serverless Function to fetch articles from RSS feed"""
import asyncio
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

PROC_POOL = ProcessPoolExecutor(max_workers=10)


class ArticleMetadata(BaseModel):
    """Model for an article entry in home feed"""

    title: str = Field(default="")
    link: str = Field(default="")
    pub_date: str = Field(default="")
    source: str = Field(default="")
    image_url: Optional[str] = Field(default=None)
    author: Optional[str] = Field(default=None)


class ArticleSource(BaseModel):
    """Model for an article source containing article entries"""

    articles: list[ArticleMetadata] = Field(default_factory=list)
    title: str = Field(default="")
    url: str = Field(default="")


class ArticleContent(BaseModel):
    """Model of a single article text content"""

    tags: list[str] = Field(default_factory=list)


class ArticleMetadataRes(BaseModel):
    """Response model for an article entry in home feed"""

    status: http.HTTPStatus = Field(default=http.HTTPStatus.OK)
    data: Optional[ArticleMetadata] = Field(default=None)


class ArticleSourceRes(BaseModel):
    """Response model for an article source containing article entries"""

    status: http.HTTPStatus = Field(default=http.HTTPStatus.OK)
    data: Optional[ArticleSource] = Field(default=None)
    message: Optional[str] = Field(default=None)


class ArticleContentRes(BaseModel):
    """Response model for article content"""

    status: http.HTTPStatus = Field(default=http.HTTPStatus.OK)
    data: Optional[ArticleContent] = Field(default=None)


class RequestType(enum.Enum):
    """Enum for client request types"""

    source = "source"
    article = "article"


class ServerRequest(BaseModel):
    """Model for client request to serverless function"""

    type: RequestType = Field(default=RequestType.source)
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


async def fetch_article_source(rss_url: str) -> ArticleSourceRes:
    """Download RSS feed and parse into ArticleSource"""
    try:
        loop = asyncio.get_event_loop()
        feed = await asyncio.wait_for(loop.run_in_executor(PROC_POOL, feedparser.parse, rss_url), timeout=5)
    except:
        return ArticleSourceRes(
            status=http.HTTPStatus.BAD_REQUEST, message="Failed to parse RSS feed"
        )
    if not feed['entries']:
        return ArticleSourceRes(
            status=http.HTTPStatus.BAD_REQUEST, message="No entries found in RSS feed"
        )
    
    feed_title = feed['feed'].get('title', "")
    image_url = ""
    if image := feed['feed'].get('image'):
        image_url = image.get('url', "")


    articles: list[ArticleMetadata] = []
    for entry in feed['entries']:
        article_meta = parse_article_meta(entry, feed_title, image_url)
        if (
            article_meta.status == http.HTTPStatus.OK
            and article_meta.data is not None
        ):
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

async def main(context):
    """Main function for the Cloud Function"""
    context.log("Starting parsing request")
    req_body = json.loads(context.req.body)
    context.log(f"Got request body {req_body}")
    req_data = ServerRequest(**req_body)

    res_data = None
    results = []
    try:
        if req_data.type == RequestType.source:
            context.log("Fetching article sources...")
            tasks = [fetch_article_source(url) for url in req_data.urls]
            results = await asyncio.gather(*tasks)
        elif req_data.type == RequestType.article:
            context.log("Fetching article content...")
            results = [fetch_article_content(url) for url in req_data.urls]

        res_data = results
    except Exception as e:
        context.log(f"Exception occurred fetching data")
        return context.res.json({"exception": str(e)})
    context.log(f"Finished fetching data")

    if not res_data:
        context.log("No data fetched")
        return context.res.json({"data": "Failed"})

    json_data = [jsonable_encoder(res) for res in res_data]
    context.log(f"Returning json data")
    return context.res.json({"data": json_data})
