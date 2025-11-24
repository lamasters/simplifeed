import datetime
import http
import json
from typing import Optional

import requests
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field
from html_reader_mode import HTMLReaderMode


class ServerRequest(BaseModel):
    """Model for client request to serverless function"""

    url: str = Field(...)


class ArticleBlock(BaseModel):
    """Model for a single block of content"""

    tag: str
    content: str


class ArticleContent(BaseModel):
    """Model of a single article text content"""

    tags: list[ArticleBlock] = Field(default_factory=list)


class ArticleContentRes(BaseModel):
    """Response model for article content"""

    status: http.HTTPStatus = Field(default=http.HTTPStatus.OK)
    data: Optional[ArticleContent] = Field(default=None)


def fetch_article_content(url: str) -> ArticleContentRes:
    """Download article content and parse into ArticleContent"""
    html_res = None
    res = requests.get(url)
    html_res = res.text
    if html_res is None:
        return ArticleContentRes(status=http.HTTPStatus.INTERNAL_SERVER_ERROR)

    reader_mode = HTMLReaderMode()
    content_blocks = reader_mode.sanitize(html_res)

    if not content_blocks:
        return ArticleContentRes(status=http.HTTPStatus.INTERNAL_SERVER_ERROR)
    return ArticleContentRes(data=ArticleContent(tags=content_blocks))


def main(context):
    """Main function for the Cloud Function"""

    def log(message):
        context.log(f"{datetime.datetime.now().strftime('%H:%M:%S')}: {message}")

    log("Starting parsing request")
    req_body = json.loads(context.req.body)
    log(f"Got request body {req_body}")
    req_data = ServerRequest(**req_body)

    log("Fetching article source...")
    try:
        res_data = fetch_article_content(req_data.url)
    except Exception as e:  # pylint: disable=broad-except
        log("Exception occurred fetching data")
        return context.res.json(
            {"message": str(e)}, statusCode=http.HTTPStatus.INTERNAL_SERVER_ERROR
        )
    log("Finished fetching data")

    if not res_data.data:
        log("No data fetched")
        return context.res.json(
            {"message": "No article content found"},
            statusCode=http.HTTPStatus.INTERNAL_SERVER_ERROR,
        )

    json_data = jsonable_encoder(res_data.data)
    log("Returning json data")
    return context.res.json({"data": json_data}, statusCode=http.HTTPStatus.OK)
