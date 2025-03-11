import datetime
import os

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.query import Query

PROJECT_ID = "67cccd44002cccfc9ae0"
FEED_DATABASE_ID = "6466af38420c3ca601c1"
NEWS_ARTICLES_COLLECTION_ID = "6797ac2e001706792636"
NEWS_FEEDS_COLLECTION_ID = "6797ac1d0029e18b03da"
SUMMARIES_BUCKET_ID = "664bcddf002e5c7eba87"


def main():
    client = Client()
    client.set_key(os.getenv("APPWRITE_API_KEY"))
    client.set_endpoint("https://cloud.appwrite.io/v1")
    client.set_project(PROJECT_ID)

    databases = Databases(client)
    storage = Storage(client)

    page_size = 50
    offset = 0
    while True:
        res = databases.list_documents(
            FEED_DATABASE_ID,
            NEWS_FEEDS_COLLECTION_ID,
            queries=[Query.limit(page_size), Query.offset(offset)],
        )
        if not res:
            break
        for news_feed in res["documents"]:
            print("Cleaning up news feed", news_feed["feed_title"])
            if len(news_feed["newsArticles"]) > 150:
                i = 0
                print("Deleting old articles")
                for article in news_feed["newsArticles"]:
                    if datetime.datetime.now(
                        tz=datetime.timezone.utc
                    ) - datetime.datetime.fromisoformat(
                        article["$createdAt"]
                    ) > datetime.timedelta(
                        days=7
                    ):
                        databases.delete_document(
                            FEED_DATABASE_ID,
                            NEWS_ARTICLES_COLLECTION_ID,
                            article["$id"],
                        )
                        i += 1
                        print(f"Deleted {i} articles")
        if len(res["documents"]) < page_size:
            break
        offset += page_size

    i = 0
    while True:
        res = storage.list_files(
            SUMMARIES_BUCKET_ID, queries=[Query.limit(page_size), Query.offset(offset)]
        )
        if not res:
            break
        for file in res["files"]:
            if datetime.datetime.now(
                tz=datetime.timezone.utc
            ) - datetime.datetime.fromisoformat(
                file["$createdAt"]
            ) > datetime.timedelta(
                days=3
            ):
                i += 1
                print(f"Deleting old summary {i}")
                storage.delete_file(SUMMARIES_BUCKET_ID, file["$id"])
        if len(res["files"]) < page_size:
            break
        offset += page_size


if __name__ == "__main__":
    main()
