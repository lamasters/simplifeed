import asyncio
import json
import mock

from get_feeds import main as get_feeds_main


def context_log(message):
    print(message)

async def test_fetch_sources():
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
        res=mock.MagicMock(json=context_log),
    )
    await get_feeds_main(context)

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
    asyncio.run(get_feeds_main(context))
    context.res.json.assert_called_once()
    
async def test_fetch_podcasts():
    context = mock.MagicMock(
        req=mock.MagicMock(
            body=json.dumps(
                {
                    "type": "podcast",
                    "urls": [
                        "https://rss.art19.com/the-headgum-podcast",
                    ],
                }
            ),
        ),
        log=context_log,
        res=mock.MagicMock(json=mock.MagicMock()),
    )
    await get_feeds_main(context)
    
    
if __name__ == "__main__":
    asyncio.run(test_fetch_podcasts())