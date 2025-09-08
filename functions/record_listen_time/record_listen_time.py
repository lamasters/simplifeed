"""Serverless function to record a user's listen time to a podcast episode"""

import json
import os

from appwrite.client import Client
from appwrite.id import ID
from appwrite.permission import Permission
from appwrite.query import Query
from appwrite.role import Role
from appwrite.services.databases import Databases
from pydantic import BaseModel, Field


class ServerRequest(BaseModel):
    """Model for client request to serverless function"""

    user_id: str = Field(...)
    title: str = Field(...)
    time: float = Field(default=0.0)
    finished: bool = Field(default=False)


def main(context):
    client = Client()
    client.set_key(os.getenv("APPWRITE_API_KEY"))
    client.set_endpoint("https://appwrite.liammasters.space/v1")
    client.set_project("67cccd44002cccfc9ae0")

    databases = Databases(client)

    req = json.loads(context.req.body)
    req_data = ServerRequest(**req)

    existing_records = databases.list_documents(
        "6466af38420c3ca601c1",
        "674637b9001d90563572",
        queries=[
            Query().equal("user_id", req_data.user_id),
            Query().equal("title", req_data.title),
        ],
    )
    if not existing_records.get("total"):
        databases.create_document(
            "6466af38420c3ca601c1",
            "674637b9001d90563572",
            ID.unique(),
            data=req_data.model_dump(),
            permissions=[
                Permission.read(Role.user(req_data.user_id)),
                Permission.update(Role.user(req_data.user_id)),
            ],
        )
    else:
        record = existing_records["documents"][0]
        databases.update_document(
            "6466af38420c3ca601c1",
            "674637b9001d90563572",
            record["$id"],
            data=req_data.model_dump(),
            permissions=[
                Permission.read(Role.user(req_data.user_id)),
                Permission.update(Role.user(req_data.user_id)),
            ],
        )
    return context.res.json({"message": "Listen time recorded successfully"})
