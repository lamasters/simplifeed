"""Serverless function to provide AI articles summaries using Google Gemini"""

import json
import os
from hashlib import md5
from typing import Optional

from appwrite.client import Client
from appwrite.input_file import InputFile
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from pydantic import BaseModel, Field
import google.generativeai as genai
from .get_article import fetch_article_content, ArticleContentRes

PROJECT_ID = "67cccd44002cccfc9ae0"
FEEDS_DATABASE_ID = "6466af38420c3ca601c1"
NEWS_ARTICLES_COLLECTION_ID = "6797ac2e001706792636"
SUMMARY_BUCKET_ID = "664bcddf002e5c7eba87"


class ServerRequest(BaseModel):
    """Model for client request to serverless function"""

    user_id: str = Field(...)
    article_url: str = Field(...)
    article_id: Optional[str] = Field(None)


def main(context):
    """Summarize an article using Google Gemini 2.5 Flash Lite."""
    context.log("Initializing appwrite client")
    req_body = json.loads(context.req.body)
    req_data = ServerRequest(**req_body)

    appwrite_client = Client()
    appwrite_client.set_key(os.getenv("APPWRITE_API_KEY"))
    appwrite_client.set_endpoint("https://appwrite.liammasters.space/v1")
    appwrite_client.set_project(PROJECT_ID)

    database = Databases(appwrite_client)

    context.log("Checking if article has already been summarized")
    url_hash = md5(req_data.article_url.encode()).hexdigest()
    summaries = Storage(appwrite_client)
    try:
        summary = summaries.get_file_download(SUMMARY_BUCKET_ID, url_hash)
        context.log("Summary found in storage, returning")
        return context.res.json(summary)
    except Exception:
        context.log("No summary found, generating one")

    res_data: ArticleContentRes = fetch_article_content(req_data.article_url)
    if not res_data.data:
        context.log("Could not fetch article content")
        return context.res.json({"error": "Failed to fetch article content from URL"})
    article_content = "\n".join(block.content for block in res_data.data.tags)
    if not article_content:
        context.log("Fetched article but content empty")
        return context.res.json({"error": "Article content empty"})

    context.log("Getting article summary from Gemini")
    try:
        genai.configure(api_key=os.getenv("GOOGLE_GEMINI_API_KEY"))
        model = genai.GenerativeModel(
            "gemini-2.5-flash-lite",
            system_instruction="Summarize the following article, highlighting the main points "
            "and providing key takeaways. Keep the summary to one paragraph to make it "
            "digestible for readers, breaking it up into bullet points. Avoid any prose that isn't directly summarizing the article.",
        )

        # Truncate content if too long (Gemini has token limits)
        max_chars = 8000
        if len(article_content) > max_chars:
            article_content = article_content[:max_chars] + "..."

        response = model.generate_content(article_content)

        summary_text = response.text
        context.log("Generated summary using Gemini")
    except Exception as e:
        context.log(f"Failed to summarize article: {e}")
        return context.res.json({"error": "Failed to generate article summary"})

    context.log("Generated summary, uploading to storage")
    summary = {"summary": summary_text}
    try:
        summaries.create_file(
            SUMMARY_BUCKET_ID,
            url_hash,
            InputFile.from_bytes(
                json.dumps(summary).encode(),
                filename=url_hash,
                mime_type="application/json",
            ),
        )
        context.log("Summary uploaded to storage")
    except Exception:
        context.log("Failed to upload summary to storage")

    if req_data.article_id:
        context.log("Updating article with summary")
        try:
            database.update_document(
                FEEDS_DATABASE_ID,
                NEWS_ARTICLES_COLLECTION_ID,
                req_data.article_id,
                {"summary_id": url_hash},
            )
            context.log("Article updated with summary")
        except Exception as e:
            context.log(f"Failed to update article with summary: {e}")

    context.log("Returning summary")
    return context.res.json(summary)
