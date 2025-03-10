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


PROJECT_ID = "65bd6d28cfc23d374173"
FEEDS_DATABASE_ID = "6466af38420c3ca601c1"
PODCAST_FEEDS_COLLECTION_ID = "6797ac11003778ff768a"
PODCAST_EPISODES_COLLECTION_ID = "6797ac2700062e762fdd"


class ServerRequest(BaseModel):
    """Model for client request to serverless function"""

    feed_id: str = Field(...)


class Episode(BaseModel):
    """Model for a podcast episode"""

    title: str = Field(...)
    audio_url: str = Field(...)
    podcastFeeds: str = Field(...)
    image_url: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)
    pub_date: Optional[str] = Field(default=None)
    duration_s: Optional[int] = Field(default=None)


def format_length(duration: str) -> int:
    """Get length of podcast in seconds from string"""
    try:
        return int(duration)
    except ValueError:
        return 0


def format_itunes_duration(duration: str) -> int:
    """Get length of podcast in seconds from string"""
    try:
        if duration.isdigit():
            return int(duration)
        else:
            hours, minutes, seconds = duration.split(":")
            return int(hours) * 3600 + int(minutes) * 60 + int(seconds)
    except ValueError:
        return 0


def parse_podcast_episode(
    item: Dict,
    databases: Databases,
    feed_id: str,
    image_url: Optional[str],
) -> http.HTTPStatus:
    """Parse a podcast episode in RSS feed into PodcastEpisode"""
    title = item.get("title")
    description = item.get("description")
    pub_date = item.get("published")
    duration = item.get("itunes_duration")
    for link in item.get("links"):
        if "audio" in link.get("type"):
            audio_url = link.get("href")
            backup_duration = link.get("length")
            break
    duration_s = format_itunes_duration(duration) or format_length(backup_duration)

    if title is None or audio_url is None:
        return http.HTTPStatus.INTERNAL_SERVER_ERROR

    title = title.strip()
    if "<" and ">" in title:
        soup = BeautifulSoup(title, "html.parser")
        title = soup.get_text(separator=" ")
    if description:
        soup = BeautifulSoup(description, "html.parser")
        description = soup.get_text(separator=" ")

    episode = Episode(
        title=title,
        audio_url=audio_url,
        podcastFeeds=feed_id,
        image_url=image_url,
        description=description,
        pub_date=pub_date,
        duration_s=duration_s,
    )
    document_id = md5(f"{title}{audio_url}".encode()).hexdigest()
    try:
        databases.create_document(
            FEEDS_DATABASE_ID,
            PODCAST_EPISODES_COLLECTION_ID,
            document_id,
            episode.model_dump(exclude_none=True),
        )
    except:
        return http.HTTPStatus.CONFLICT
    return http.HTTPStatus.OK


def fetch_podcast_source(
    rss_url: str, databases: Databases, feed_id: str, log: Callable
) -> http.HTTPStatus:
    """Download podcast RSS feed and parse into PodcastSource"""
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
        image_url = image.get("href")

    episode_responses = []
    last_3_responses = []
    for entry in feed["entries"]:
        res = parse_podcast_episode(entry, databases, feed_id, image_url)
        last_3_responses.append(res)
        episode_responses.append(res)
        if len(last_3_responses) > 3:
            last_3_responses.pop(0)
        if all(res == http.HTTPStatus.CONFLICT for res in last_3_responses):
            log(f"Encountered existing episodes, exiting early")
            break

    if all(res == http.HTTPStatus.INTERNAL_SERVER_ERROR for res in episode_responses):
        return http.HTTPStatus.INTERNAL_SERVER_ERROR
    elif any(res == http.HTTPStatus.INTERNAL_SERVER_ERROR for res in episode_responses):
        return http.HTTPStatus.PARTIAL_CONTENT
    elif all(res == http.HTTPStatus.CONFLICT for res in episode_responses):
        return http.HTTPStatus.CONFLICT
    return http.HTTPStatus.OK


def main(context):
    """Main function for the Cloud Function"""

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

    log("Fetching podcast feed...")
    try:
        feed_res = databases.get_document(
            FEEDS_DATABASE_ID, PODCAST_FEEDS_COLLECTION_ID, req_data.feed_id
        )
    except Exception as e:
        log(f"Failed to get feed document {req_data.feed_id} {e}")
        return context.res.json(
            {"message": str(e)}, statusCode=http.HTTPStatus.INTERNAL_SERVER_ERROR
        )
    try:
        res = fetch_podcast_source(
            feed_res["rss_url"], databases, req_data.feed_id, log
        )
    except Exception as e:  # pylint: disable=broad-except
        log("Exception occurred fetching data {e}")
        return context.res.json(
            {"message": str(e)}, statusCode=http.HTTPStatus.INTERNAL_SERVER_ERROR
        )

    databases.update_document(
        FEEDS_DATABASE_ID,
        PODCAST_FEEDS_COLLECTION_ID,
        req_data.feed_id,
        {
            "last_update": datetime.datetime.now(tz=datetime.timezone.utc).strftime(
                "%Y-%m-%dT%H:%M:%S.%f%z"
            )
        },
    )
    log("Finished fetching data")
    return context.res.json({}, statusCode=res)
