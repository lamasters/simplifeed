"""Serverless function to schedule parsing all news and podcast rss feeds."""

import http
import json
import os
import datetime

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.functions import Functions
from appwrite.query import Query

PROJECT_ID = "67cccd44002cccfc9ae0"
FEED_DATABASE_ID = "6466af38420c3ca601c1"
NEWS_FEEDS_COLLECTION_ID = "6797ac1d0029e18b03da"
PODCAST_FEEDS_COLLECTION_ID = "6797ac11003778ff768a"
INDEX_NEWS_FEED_FUNCTION_ID = "679fc996043c9a90e2df"
INDEX_PODCAST_FEED_FUNCTION_ID = "679fe0e256c67950d62e"


def wait_for_execution(functions, function_id, execution_id):
    while True:
        execution = functions.get_execution(function_id, execution_id)
        if execution["status"] in ("completed", "failed"):
            return execution


def main(context):
    client = Client()
    client.set_key(os.getenv("APPWRITE_API_KEY"))
    client.set_endpoint("https://cloud.appwrite.io/v1")
    client.set_project(PROJECT_ID)

    databases = Databases(client)
    functions = Functions(client)

    news_rss_feeds = []
    num_results = 100
    page_size = 100
    offset = 0
    while num_results >= page_size:
        res = databases.list_documents(
            FEED_DATABASE_ID,
            NEWS_FEEDS_COLLECTION_ID,
            queries=[Query.limit(page_size), Query.offset(offset)],
        )
        if not res:
            context.error("No news feeds found")
            break
        else:
            context.log(f"Found {len(res['documents'])} news feeds")
            news_rss_feeds += res["documents"]
            num_results = len(res["documents"])
            offset += page_size
            
    num_results = 100
    offset = 0
    podcast_rss_feeds = []
    while num_results >= page_size:
        res = databases.list_documents(
            FEED_DATABASE_ID,
            PODCAST_FEEDS_COLLECTION_ID,
            queries=[Query.limit(page_size), Query.offset(offset)],
        )
        if not res:
            context.error("No podcast feeds found")
            break
        else:
            context.log(f"Found {len(res['documents'])} podcast feeds")
            podcast_rss_feeds += res["documents"]
            num_results = len(res["documents"])
            offset += page_size

    news_feed_id_to_execution_id = {}
    for feed in news_rss_feeds:
        "2025-01-30T20:06:38.061+00:00"
        last_update = datetime.datetime.strptime(
            feed["last_update"], "%Y-%m-%dT%H:%M:%S.%f%z"
        )
        update_interval = feed["update_interval_minutes"]
        if (
            datetime.datetime.now(tz=datetime.timezone.utc) - last_update
        ).total_seconds() / 60 > update_interval:
            context.log(f"Updating news feed {feed['$id']} {feed['feed_title']}")
            execution = functions.create_execution(
                INDEX_NEWS_FEED_FUNCTION_ID,
                body=json.dumps({"feed_id": feed["$id"]}),
                xasync=True,
            )
            news_feed_id_to_execution_id[feed["$id"]] = execution["$id"]
        else:
            context.log(
                f"Skipping news feed {feed['$id']} {feed['feed_title']} as it was updated recently"
            )

    podcast_feed_id_to_execution_id = {}
    for feed in podcast_rss_feeds:
        last_update = datetime.datetime.strptime(
            feed["last_update"], "%Y-%m-%dT%H:%M:%S.%f%z"
        )
        update_interval = feed["update_interval_minutes"]
        if (
            datetime.datetime.now(tz=datetime.timezone.utc) - last_update
        ).total_seconds() / 60 > update_interval:
            context.log(f"Updating podcast feed {feed['$id']} {feed['feed_title']}")
            execution = functions.create_execution(
                INDEX_PODCAST_FEED_FUNCTION_ID,
                body=json.dumps({"feed_id": feed["$id"]}),
                xasync=True,
            )
            podcast_feed_id_to_execution_id[feed["$id"]] = execution["$id"]
        else:
            context.log(
                f"Skipping podcast feed {feed['$id']} {feed['feed_title']} as it was updated recently"
            )

    return context.res.json(
        {"message": "Scheduled feed updates"}, statusCode=http.HTTPStatus.ACCEPTED
    )

    news_feed_id_to_execution_result = {}
    for feed_id, execution_id in news_feed_id_to_execution_id.items():
        execution = wait_for_execution(
            functions, INDEX_NEWS_FEED_FUNCTION_ID, execution_id
        )
        news_feed_id_to_execution_result[feed_id] = execution["responseStatusCode"]
    context.log(f"News feed results: {news_feed_id_to_execution_result}")

    podcast_feed_id_to_execution_result = {}
    for feed_id, execution_id in podcast_feed_id_to_execution_id.items():
        execution = wait_for_execution(
            functions, INDEX_PODCAST_FEED_FUNCTION_ID, execution_id
        )
        podcast_feed_id_to_execution_result[feed_id] = execution["responseStatusCode"]
    context.log(f"Podcast feed results: {podcast_feed_id_to_execution_result}")

    if all(
        status == http.HTTPStatus.OK
        for status in news_feed_id_to_execution_result.values()
    ) and all(
        status == http.HTTPStatus.OK
        for status in podcast_feed_id_to_execution_result.values()
    ):
        context.log("All feeds updated successfully")
        return context.res.json(
            {"message": "Successfully updated all feeds"}, statusCode=http.HTTPStatus.OK
        )
    elif any(
        status == http.HTTPStatus.OK
        for status in news_feed_id_to_execution_result.values()
    ) or any(
        status == http.HTTPStatus.OK
        for status in podcast_feed_id_to_execution_result.values()
    ):
        context.log("Some feeds updated successfully")
        return context.res.json(
            {"message": "Successfully updated some feeds"},
            statusCode=http.HTTPStatus.PARTIAL_CONTENT,
        )
    else:
        context.error("Failed to update any feeds")
        return context.res.json(
            {"message": "Failed to update any feeds"},
            statusCode=http.HTTPStatus.INTERNAL_SERVER_ERROR,
        )
