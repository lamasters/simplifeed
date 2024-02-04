"""Serverless function to provide AI articles summaries"""

import json
import os
from appwrite.client import Client
from appwrite.query import Query
from appwrite.services.databases import Databases
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

    context.log("Getting article summary")
    try:
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        res = openai_client.chat.completions.create(
            model="gpt-3.5-turbo-0125",
            messages=[
                {
                    "role": "system",
                    "content": "Summarize the following article, highlighting the main points and providing key takeaways.",
                },
                {"role": "user", "content": req_body["article"]},
            ],
        )
    except Exception as e:
        context.log(f"Failed to summarize article {e}")
        return context.res.json({"error": "Failed to generate article summary"})

    context.log("Generated summary, returning to user")
    return context.res.json({"summary": res.choices[0].message.content})
