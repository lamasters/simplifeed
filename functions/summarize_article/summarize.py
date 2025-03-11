"""Serverless function to provide AI articles summaries"""

import json
import os
from hashlib import md5
from typing import Optional

from appwrite.client import Client
from appwrite.input_file import InputFile
from appwrite.query import Query
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from openai import OpenAI
from pydantic import BaseModel, Field

PROJECT_ID = "67cccd44002cccfc9ae0"
FEEDS_DATABASE_ID = "6466af38420c3ca601c1"
NEWS_ARTICLES_COLLECTION_ID = "6797ac2e001706792636"
SUMMARY_BUCKET_ID = "664bcddf002e5c7eba87"


class ServerRequest(BaseModel):
    """Model for client request to serverless function"""

    user_id: str = Field(...)
    article: str = Field(...)
    article_id: Optional[str] = Field(None)


def main(context):
    """Summarize an article using the configured OpenAI model."""
    context.log("Initializing appwrite client")
    req_body = json.loads(context.req.body)
    req_data = ServerRequest(**req_body)

    appwrite_client = Client()
    appwrite_client.set_key(os.getenv("APPWRITE_API_KEY"))
    appwrite_client.set_endpoint("https://cloud.appwrite.io/v1")
    appwrite_client.set_project(PROJECT_ID)

    database = Databases(appwrite_client)

    context.log("Checking if article has already been summarized")
    article_hash = md5(req_data.article.encode()).hexdigest()
    summaries = Storage(appwrite_client)
    try:
        summary = summaries.get_file_download(SUMMARY_BUCKET_ID, article_hash)
        context.log("Summary found in storage, returning")
        return context.res.json(summary)
    except:
        context.log("No summary found, generating one")

    context.log("Getting article summary")
    article = (
        req_data.article.replace("  ", "")
        .replace("\n", "")
        .replace("\r", "")
        .replace("\t", "")
    )
    try:
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        context.log(f"Generating summary using model {os.getenv('OPENAI_MODEL_ID')}")
        res = openai_client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL_ID"),
            messages=[
                {
                    "role": "system",
                    "content": "Summarize the following article, highlighting the main points "
                    "and providing key takeaways. Keep the summary to one paragraph to make it "
                    "digestible for readers.",
                },
                {"role": "user", "content": article},
            ],
        )
    except Exception as e:
        context.log(f"Failed to summarize article {e}")
        return context.res.json({"error": "Failed to generate article summary"})

    context.log("Generated summary, uploading to storage")
    summary = {"summary": res.choices[0].message.content}
    try:
        summaries.create_file(
            SUMMARY_BUCKET_ID,
            article_hash,
            InputFile.from_bytes(
                json.dumps(summary).encode(),
                filename=article_hash,
                mime_type="application/json",
            ),
        )
        context.log("Summary uploaded to storage")
    except:
        context.log("Failed to upload summary to storage")

    if req_data.article_id:
        context.log("Updating article with summary")
        try:
            database.update_document(
                FEEDS_DATABASE_ID,
                NEWS_ARTICLES_COLLECTION_ID,
                req_data.article_id,
                {"summary_id": article_hash},
            )
            context.log("Article updated with summary")
        except Exception as e:
            context.log(f"Failed to update article with summary {e}")
    context.log("Returning summary")
    return context.res.json(summary)
