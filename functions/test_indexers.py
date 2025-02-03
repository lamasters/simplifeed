import json
from unittest import mock

from index_news_feed.index_news_feed import main as get_news_main
from index_podcast_feed.index_podcast_feed import main as get_podcasts_main
from get_article.get_article import main as get_article_main
from create_news_feed.create_news_feed import main as create_news_feed_main
from create_podcast_feed.create_podcast_feed import main as create_podcast_feed_main
from scheduler.scheduler import main as scheduler_main


def context_log(message, statusCode=None):
    if statusCode is not None:
        print(f"{statusCode}: {message}")
    else:
        print(message)


def context_mock(body):
    return mock.MagicMock(
        log=context_log,
        req=mock.MagicMock(body=json.dumps(body)),
        res=mock.MagicMock(json=context_log),
        error=context_log,
    )


def test_index_articles():
    execution_context = context_mock({"feed_id": "679d73a90032e2473101"})
    get_news_main(execution_context)


def test_index_podcasts():
    execution_context = context_mock({"feed_id": "679d9d9c001145ab505a"})
    get_podcasts_main(execution_context)


def test_parse_article():
    execution_context = context_mock(
        {
            "url": "https://www.npr.org/2025/01/31/nx-s1-5282222/oscar-nominated-actress-karla-sofia-gascon-apologizes-for-old-social-media-posts"
        }
    )
    get_article_main(execution_context)


def test_create_news_feed():
    execution_context = context_mock({"url": "https://9to5google.com/feed/"})
    create_news_feed_main(execution_context)


def test_create_podcast_feed():
    execution_context = context_mock({"url": "https://feeds.megaphone.fm/lateralcast"})
    create_podcast_feed_main(execution_context)


def test_scheduler():
    execution_context = context_mock({})
    scheduler_main(execution_context)


if __name__ == "__main__":
    test_scheduler()
