"""Serverless function to generate daily news digest with key topics and summaries."""

import json
import os
import datetime
import traceback
from typing import Optional

from appwrite.client import Client
from appwrite.id import ID
from appwrite.input_file import InputFile
from appwrite.permission import Permission
from appwrite.query import Query
from appwrite.role import Role
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from pydantic import BaseModel, Field
from google import genai

PROJECT_ID = "67cccd44002cccfc9ae0"
FEEDS_DATABASE_ID = "6466af38420c3ca601c1"
SUBSCRIPTIONS_COLLECTION_ID = "6797b43c001f4e9c95a0"
NEWS_ARTICLES_COLLECTION_ID = "6797ac2e001706792636"
DAILY_DIGESTS_COLLECTION_ID = "daily_digests"
DAILY_DIGESTS_BUCKET_ID = "69bc5ac9002befcdfd9a"
SUMMARY_BUCKET_ID = "664bcddf002e5c7eba87"


class ServerRequest(BaseModel):
    """Model for cron request (optional, in case called with parameters)"""

    user_id: Optional[str] = Field(None)


def get_article_summaries(context, databases, article_ids):
    """Fetch summaries for articles, retrieving from cache if available."""
    summaries_storage = Storage(
        Client()
        .set_key(os.getenv("APPWRITE_API_KEY"))
        .set_endpoint("https://appwrite.liammasters.space/v1")
        .set_project(PROJECT_ID)
    )

    article_summaries = {}
    for article_id in article_ids:
        try:
            # Try to get from cache
            cached = summaries_storage.get_file_download(SUMMARY_BUCKET_ID, article_id)
            if cached:
                article_summaries[article_id] = json.loads(
                    cached.decode() if isinstance(cached, bytes) else cached
                )
        except Exception as e:
            context.log(f"Could not fetch cached summary for {article_id}: {e}")
            article_summaries[article_id] = None

    return article_summaries


def extract_topics_from_articles(context, articles, summaries):
    """Use Gemini LLM to extract 3-7 key topics from articles."""
    try:
        client = genai.Client(api_key=os.getenv("GOOGLE_GEMINI_API_KEY"))
        # grounding_tool = types.Tool(google_search=types.GoogleSearch())
        # config = types.GenerateContentConfig(tools=[grounding_tool])

        # Prepare article text for LLM
        article_text = ""
        for i, article in enumerate(articles):
            title = article.get("title", "Unknown")
            description = article.get("description", "")
            article_text += f"{i}: Title: {title}\nContent: {description}\n\n"

        prompt = f"""Analyze the following news articles and extract 3-7 key topics that are being discussed. 
        For each topic, provide:
        1. Topic name
        2. A 1-2 sentence summary of the topic
        3. 2-3 articles most relevant to this topic (by index in the provided list)
        
        Format your response as a valid JSON array with objects containing 'topic', 'summary' and 'article_indices'.
        
        Articles:
        {article_text}
        
        Return ONLY valid JSON, no additional text."""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            # config=config,
        )

        # Parse response and extract topics
        if response.text is not None:
            response_text = response.text.strip()
        else:
            context.error("LLM response has no text content")
            return []
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.rstrip("```")

        topics_data = json.loads(response_text)
        context.log(f"Extracted {len(topics_data)} topics from articles")
        return topics_data
    except Exception as e:
        tb = traceback.format_exc()
        context.log(f"Failed to extract topics from articles: {e}\n{tb}")
        return []


def build_digest_document(context, topics, articles, feeds_map):
    context.log("Building digest document structure")
    """Build the digest document structure."""
    digest = {
        "generated_at": datetime.datetime.now(tz=datetime.timezone.utc).isoformat(),
        "date": datetime.datetime.now(tz=datetime.timezone.utc).strftime("%Y-%m-%d"),
        "topics": [],
    }

    for topic in topics:
        topic_item = {
            "topic": topic.get("topic", ""),
            "summary": topic.get("summary", ""),
            "citations": [],
        }

        # Get relevant articles for citations
        article_indices = topic.get("article_indices", [])
        for idx in article_indices:
            if 0 <= idx < len(articles):
                article = articles[idx]
                feed_id = article.get("news_feed", {}).get("$id", "")
                feed_name = feeds_map.get(feed_id, "Unknown Feed")

                citation = {
                    "title": article.get("title", ""),
                    "feed_name": feed_name,
                    "url": article.get("article_url", ""),
                }
                topic_item["citations"].append(citation)

        digest["topics"].append(topic_item)

    return digest


def extract_user_id_from_permissions(user_sub):
    """Extract user ID from document permissions."""
    permissions = user_sub.get("$permissions", [])
    for permission in permissions:
        if permission.startswith('read("user:'):
            # Extract user ID from "read(\"user:user_id\")"
            return permission.split('read("user:')[1].rstrip('")')
    return None


def main(context):
    """Generate daily digests for all users with daily_digest enabled."""
    context.log("Starting daily digest generation")

    appwrite_client = Client()
    appwrite_client.set_key(os.getenv("APPWRITE_API_KEY"))
    appwrite_client.set_endpoint("https://appwrite.liammasters.space/v1")
    appwrite_client.set_project(PROJECT_ID)

    databases = Databases(appwrite_client)
    storage = Storage(appwrite_client)

    # Get all users with daily_digest enabled
    users_with_digest = []
    page_size = 100
    offset = 0
    num_results = 100

    context.log("Querying users with daily_digest enabled")
    while num_results >= page_size:
        try:
            res = databases.list_documents(
                FEEDS_DATABASE_ID,
                SUBSCRIPTIONS_COLLECTION_ID,
                queries=[
                    Query.equal("daily_digest", True),
                    Query.limit(page_size),
                    Query.offset(offset),
                ],
            )
            if res and isinstance(res, dict) and res.get("documents"):
                users_with_digest.extend(res["documents"])
                num_results = len(res["documents"])
                offset += page_size
            else:
                break
        except Exception as e:
            context.log(f"Error querying subscriptions: {e}")
            break

    context.log(f"Found {len(users_with_digest)} users with daily_digest enabled")

    digests_created = 0

    for user_sub in users_with_digest:
        user_id = extract_user_id_from_permissions(user_sub)
        if not user_id:
            context.log(
                f"Could not extract user ID from subscription document {user_sub.get('$id')}, skipping"
            )
            continue

        news_feed_ids = user_sub.get("news_feed_ids", [])

        if not news_feed_ids:
            context.log(f"User {user_id} has no news feeds subscribed, skipping")
            continue

        context.log(
            f"Processing digest for user {user_id} with {len(news_feed_ids)} feeds"
        )

        # Get articles from the last 24 hours for user's subscribed feeds
        cutoff_time = (
            datetime.datetime.now(tz=datetime.timezone.utc)
            - datetime.timedelta(hours=24)
        ).isoformat()

        try:
            # Create queries for user's subscribed feeds (similar to getSubscribedFeeds)
            feed_queries = [
                Query.equal("news_feed", feed_id) for feed_id in news_feed_ids
            ]
            queries = [
                Query.greater_than_equal("pub_date", cutoff_time),
                Query.limit(250),
            ]

            # Add feed filter queries
            if len(feed_queries) == 1:
                queries.append(feed_queries[0])
            elif len(feed_queries) > 1:
                queries.append(Query.or_queries(feed_queries))

            articles_res = databases.list_documents(
                FEEDS_DATABASE_ID,
                NEWS_ARTICLES_COLLECTION_ID,
                queries=queries,
            )

            if (
                articles_res
                and isinstance(articles_res, dict)
                and articles_res.get("documents")
            ):
                user_articles = articles_res.get("documents", [])
            else:
                context.log(
                    f"No articles found for user {user_id} in the last 24 hours"
                )
                user_articles = []

            context.log(
                f"Found {len(user_articles)} articles from last 24h for user {user_id}"
            )

            if len(user_articles) < 3:
                context.log(f"User {user_id} has fewer than 3 articles, skipping")
                continue

            # Get feed names for citations
            feeds_map = {}
            for feed_id in news_feed_ids:
                try:
                    feed = databases.get_document(
                        FEEDS_DATABASE_ID, "6797ac1d0029e18b03da", feed_id
                    )
                    if feed and isinstance(feed, dict):
                        feeds_map[feed_id] = feed.get("feed_title", "Unknown Feed")
                except Exception as e:
                    context.log(f"Could not fetch feed {feed_id}: {e}")
                    feeds_map[feed_id] = "Unknown Feed"

            # Extract topics using LLM
            topics = extract_topics_from_articles(context, user_articles, {})

            if not topics:
                context.log(f"Could not extract topics for user {user_id}, skipping")
                continue

            # Build digest document
            digest = build_digest_document(context, topics, user_articles, feeds_map)

            # Upload digest to storage
            today_date = datetime.datetime.now(tz=datetime.timezone.utc).strftime(
                "%Y-%m-%d"
            )
            file_name = f"{user_id}_{today_date}.json"

            try:
                file_response = storage.create_file(
                    DAILY_DIGESTS_BUCKET_ID,
                    ID.unique(),
                    InputFile.from_bytes(
                        json.dumps(digest).encode(),
                        filename=file_name,
                        mime_type="application/json",
                    ),
                    permissions=[Permission.read(Role.user(user_id))],
                )

                if (
                    file_response
                    and isinstance(file_response, dict)
                    and file_response.get("$id")
                ):
                    file_id = file_response.get("$id")
                else:
                    context.log(f"Failed to upload digest file for user {user_id}")
                    continue
                context.log(f"Uploaded digest file {file_id} for user {user_id}")

                # Create database record
                try:
                    databases.create_document(
                        FEEDS_DATABASE_ID,
                        DAILY_DIGESTS_COLLECTION_ID,
                        ID.unique(),
                        data={
                            "digest_id": file_id,
                        },
                        permissions=[Permission.read(Role.user(user_id))],
                    )

                    context.log(f"Created digest record for user {user_id}")
                    digests_created += 1
                except Exception as e:
                    context.log(
                        f"Failed to create digest record for user {user_id}: {e}"
                    )

            except Exception as e:
                context.log(f"Failed to upload digest file for user {user_id}: {e}")

        except Exception as e:
            tb = traceback.format_exc()
            context.log(f"Error processing digest for user {user_id}: {e}\n{tb}")

    context.log(f"Completed digest generation. Created {digests_created} digests")
    return context.res.json(
        {
            "message": "Daily digest generation completed",
            "digests_created": digests_created,
        }
    )
