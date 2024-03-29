"""Serverless Function to fetch articles from RSS feed"""
import enum
from fastapi.encoders import jsonable_encoder
import html
import http
import json
import requests
import xml.etree.ElementTree as et
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor
from pydantic import BaseModel, Field
from typing import Optional

THREADS = ThreadPoolExecutor(max_workers=10)

class ArticleMetadata(BaseModel):
    """Model for an article entry in home feed"""

    title: str = Field(default="")
    link: str = Field(default="")
    pub_date: str = Field(default="")
    source: str = Field(default="")
    image_url: Optional[str] = Field(default=None)


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


def parse_article_meta(item: et.Element, source: str, image_url: Optional[str]) -> ArticleMetadataRes:
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
            title=title.strip(), link=link, pub_date=pub_date, source=source.strip(), image_url=image_url,
        )
    )


def fetch_article_source(rss_url: str) -> ArticleSourceRes:
    """Download RSS feed and parse into ArticleSource"""
    rss_res = None
    res = requests.get(rss_url)
    rss_res = res.text

    if rss_res is None:
        return ArticleSourceRes(status=http.HTTPStatus.BAD_REQUEST)

    rss_data = html.unescape(rss_res).replace("&", "&amp;")
    try:
        xml_root = et.fromstring(rss_data)
    except et.ParseError:
        return ArticleSourceRes(status=http.HTTPStatus.BAD_REQUEST)

    if not xml_root:
        return ArticleSourceRes(status=http.HTTPStatus.BAD_REQUEST)

    channel = xml_root.find("channel")
    if not channel:
        return ArticleSourceRes(status=http.HTTPStatus.BAD_REQUEST)

    articles: list[ArticleMetadata] = []
    image_url = ""
    title = ""
    if (title_tag := channel.find("title")) is not None:
        title = title_tag.text if title_tag.text is not None else ""
    if (image := channel.find("image.url")) is not None:
        image_url = image.text if image.text is not None else None
    for child in channel:
        if child.tag == "item":
            article_meta = parse_article_meta(child, title, image_url)
            if (
                article_meta.status == http.HTTPStatus.OK
                and article_meta.data is not None
            ):
                articles.append(article_meta.data)

    return ArticleSourceRes(data=ArticleSource(articles=articles, title=title.strip(), url=rss_url))


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


def main(context):
    """Main function for the Cloud Function"""
    context.log("Starting parsing request")
    req_body = json.loads(context.req.body)
    context.log(f"Got request body {req_body}")
    req_data = ServerRequest(**req_body)

    res_data = None
    tasks = []
    try:
        if req_data.type == RequestType.source:
            context.log("Fetching article sources...")
            tasks = [fetch_article_source(url) for url in req_data.urls]
        elif req_data.type == RequestType.article:
            context.log("Fetching article content...")
            tasks = [fetch_article_content(url) for url in req_data.urls]

        res_data = tasks
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
