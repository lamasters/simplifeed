import datetime
import http
import json
import os
import time
from hashlib import md5
from typing import Callable, Optional

import feedparser
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.functions import Functions
from pydantic import BaseModel, Field

PROJECT_ID = "67cccd44002cccfc9ae0"
FEEDS_DATABASE_ID = "6466af38420c3ca601c1"
PODCAST_FEEDS_COLLECTION_ID = "6797ac11003778ff768a"
PODCAST_EPISODES_COLLECTION_ID = "6797ac2700062e762fdd"
INDEX_PODCAST_FUNCTION_ID = "679fe0e256c67950d62e"
SUBSCRIPTIONS_COLLECTION_ID = "6797b43c001f4e9c95a0"


class ServerRequest(BaseModel):
    """Model for client request to serverless function"""

    url: str = Field(...)
    subscriptions_id: Optional[str] = Field(default=None)


class PodcastFeed(BaseModel):
    """Model for a podcast feed"""

    feed_title: str = Field(...)
    rss_url: str = Field(...)
    last_update: Optional[str] = Field(default=None)
    update_interval_minutes: Optional[int] = Field(default=None)
    image_url: Optional[str] = Field(default=None)


class PodcastFeedRes(BaseModel):
    """Response model for podcast feed"""

    status: http.HTTPStatus = Field(default=http.HTTPStatus.OK)
    data: Optional[PodcastFeed] = Field(default=None)


def fetch_podcast_source(rss_url: str, log: Callable) -> PodcastFeedRes:
    """Download RSS feed and parse into PodcastFeed"""
    try:
        feed = feedparser.parse(rss_url)
    except Exception as e:  # pylint: disable=broad-except
        log(f"Failed to parse RSS feed {rss_url}")
        return PodcastFeedRes(status=http.HTTPStatus.INTERNAL_SERVER_ERROR)
    if not feed["entries"]:
        return PodcastFeedRes(status=http.HTTPStatus.INTERNAL_SERVER_ERROR)

    image_url = None
    if image := feed["feed"].get("image"):
        image_url = image.get("href")

    title = feed["feed"].get("title")

    return PodcastFeedRes(
        data=PodcastFeed(
            feed_title=title,
            rss_url=rss_url,
            image_url=image_url,
        )
    )


def add_feed_to_subscriptions(databases: Databases, subscription_id: str, feed_id: str):
    """Add feed to user subscriptions"""
    user_subscriptions = databases.get_document(
        FEEDS_DATABASE_ID, SUBSCRIPTIONS_COLLECTION_ID, subscription_id
    )
    if subscription_id not in user_subscriptions["podcast_feed_ids"]:
        user_subscriptions["podcast_feed_ids"].append(feed_id)
        databases.update_document(
            FEEDS_DATABASE_ID,
            SUBSCRIPTIONS_COLLECTION_ID,
            subscription_id,
            {"podcast_feed_ids": user_subscriptions["podcast_feed_ids"]},
        )


def main(context):
    """Main entry point for the serveless function to create an rss feed subscription"""

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
    functions = Functions(client)

    feed_res = fetch_podcast_source(req_data.url, log)
    if feed_res.status != http.HTTPStatus.OK:
        return context.res.json({}, statusCode=feed_res.status)

    document_id = md5(
        f"{feed_res.data.feed_title}{feed_res.data.rss_url}".encode()
    ).hexdigest()
    log(f"Creating feed record with id {document_id}")
    try:
        databases.create_document(
            FEEDS_DATABASE_ID,
            PODCAST_FEEDS_COLLECTION_ID,
            document_id,
            feed_res.data.model_dump(exclude_none=True),
        )
    except:
        log(f"Feed {feed_res.data.feed_title} already exists")
        if req_data.subscriptions_id:
            log(f"Adding feed to subscriptions {req_data.subscriptions_id}")
            add_feed_to_subscriptions(databases, req_data.subscriptions_id, document_id)
        return context.res.json({}, statusCode=http.HTTPStatus.CONFLICT)
    log(f"Attempting to parse feed {feed_res.data.feed_title}")
    execution = functions.create_execution(
        INDEX_PODCAST_FUNCTION_ID,
        body=json.dumps({"feed_id": document_id}),
        xasync=True,
    )
    execution_id = execution["$id"]

    execution_completed = False
    while not execution_completed:
        execution = functions.get_execution(
            INDEX_PODCAST_FUNCTION_ID,
            execution_id,
        )
        execution_completed = execution["status"] in ("completed", "failed")
        log(f"Execution status: {execution['status']}")

    if execution["status"] == "completed":
        res_status = execution["responseStatusCode"]
        log(f"Got response {res_status}")
    if (
        execution["status"] == "failed"
        or res_status == http.HTTPStatus.INTERNAL_SERVER_ERROR
    ):
        log("Failed to parse feed, deleting feed record")
        databases.delete_document(
            FEEDS_DATABASE_ID, PODCAST_FEEDS_COLLECTION_ID, document_id
        )
        return context.res.json(
            {},
            statusCode=http.HTTPStatus.INTERNAL_SERVER_ERROR,
        )
    if req_data.subscriptions_id:
        log(f"Adding feed to subscriptions {req_data.subscriptions_id}")
        add_feed_to_subscriptions(databases, req_data.subscriptions_id, document_id)
    log(f"Successfully parsed feed {feed_res.data.feed_title}")
    return context.res.json({}, statusCode=http.HTTPStatus.OK)
