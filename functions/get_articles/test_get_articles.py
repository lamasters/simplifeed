import asyncio
import json
import mock

from get_articles import main as get_articles_main


def context_log(message):
    print(message)

def test_fetch_sources():
    context = mock.MagicMock(
        req=mock.MagicMock(
            body=json.dumps(
                {
                    "type": "source",
                    "urls": [
                        "https://9to5mac.com/feed/",
                        "https://techcrunch.com/feed/",
                        "https://feeds2.feedburner.com/androidcentral",
                        "https://9to5google.com/feed/",
                        "https://www.biopharmadive.com/feeds/news/",
                        "https://www.ifixit.com/News/rss",
                        "https://www.theverge.com/rss/frontpage",
                        "https://rss.cbc.ca/lineup/topstories.xml",
                        "https://www.cbc.ca/webfeed/rss/rss-sports-soccer",
                    ],
                }
            ),
        ),
        log=context_log,
        res=mock.MagicMock(json=mock.MagicMock()),
    )
    asyncio.run(get_articles_main(context))
    context.res.json.assert_called_once()

def test_fetch_article():
    context = mock.MagicMock(
        req=mock.MagicMock(
            body=json.dumps(
                {'type': 'article', 'urls': ['https://techcrunch.com/2024/05/26/ai-garry-tan-y-combinator/']}
            ),
        ),
        log=context_log,
        res=mock.MagicMock(json=mock.MagicMock()),
    )
    asyncio.run(get_articles_main(context))
    context.res.json.assert_called_once()