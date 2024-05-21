"""Serverless function to provide AI articles summaries"""

import json
import os
from hashlib import md5
from appwrite.client import Client
from appwrite.input_file import InputFile
from appwrite.query import Query
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from openai import OpenAI


def main(context):
    """Summarize an article using OpenAI's GPT-3.5 model."""
    context.log("Initializing appwrite client")
    req_body = json.loads(context.req.body)

    appwrite_client = Client()
    appwrite_client.set_key(os.getenv("APPWRITE_API_KEY"))
    appwrite_client.set_endpoint("https://homelab.hippogriff-lime.ts.net/v1")
    appwrite_client.set_project("65bd6d28cfc23d374173")

    database = Databases(appwrite_client)
    context.log("Check that the user has permission for AI summaries")
    try:
        records = database.list_documents(
            "65bed3f5dff3f19853f7",
            "65bed3fb0512dd5b5d27",
            queries=[Query().equal("user_id", req_body["user_id"])],
        )
    except:
        return context.res.json({"error": "Failed to check user permissions"})

    if not records:
        return context.res.json(
            {"error": "User does not have permission to use AI summaries"}
        )

    context.log("Checking if article has already been summarized")
    article_hash = md5(req_body["article"].encode()).hexdigest()
    summaries = Storage(appwrite_client)
    try:
        summary = summaries.get_file_download("664bcddf002e5c7eba87", article_hash)
        context.log("Summary found in storage, returning")
        return context.res.json(summary)
    except:
        context.log("No summary found, generating one")

    context.log("Getting article summary")
    try:
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        res = openai_client.chat.completions.create(
            model="gpt-3.5-turbo-0125",
            messages=[
                {
                    "role": "system",
                    "content": "Summarize the following article, highlighting the main points "
                    "and providing key takeaways.",
                },
                {"role": "user", "content": req_body["article"]},
            ],
        )
    except Exception as e:
        context.log(f"Failed to summarize article {e}")
        return context.res.json({"error": "Failed to generate article summary"})

    context.log("Generated summary, uploading to storage")
    summary = {"summary": res.choices[0].message.content}
    try:
        summaries.create_file(
            "664bcddf002e5c7eba87",
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
    context.log("Returning summary")
    return context.res.json(summary)
