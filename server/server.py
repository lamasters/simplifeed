import html
import json
import requests
import uvicorn
import xml.etree.ElementTree as et
from bs4 import BeautifulSoup
from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

class Article(BaseModel):
    title: str
    link :str
    pubDate: str
    imageUrl: Optional[str]

class Articles(BaseModel):
    articles: list[Article]
    title: str
    image: Optional[str]

class ArticleText(BaseModel):
    tags: list[str]

app = FastAPI()

origins = [
#    "75.101.230.175",
#    "simplifeed.org",
     "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def parse_item(item, image_url):
    title = None
    link = None
    pubDate = None
    for child in item:
        if child.tag == "title":
            title = child.text
        elif child.tag == "link":
            link = child.text
        elif child.tag == "pubDate":
            pubDate = child.text

    if title is None or link is None:
        return None
    return Article(title=title, link=link, pubDate=pubDate, imageUrl=image_url)

def parse_image(img):
    for child in img:
        if child.tag == "url":
            return child.text
    return None

def get_text_from_p_tags(html_str: str):
    soup = BeautifulSoup(html_str, "html.parser")
    p_tags = soup.find_all("p")
    return [p.get_text() for p in p_tags]

def parse_article(url):
    res = requests.get(url)
    data = html.unescape(res.text)
    data = data.replace("&", "&amp;")
    print(data)
    article = ArticleText(tags=get_text_from_p_tags(data))

    return article 

def parse_data(url):
    res = requests.get(url)

    data = html.unescape(res.text)
    data = data.replace("&", "&amp;")
    root = et.fromstring(data)
    if not len(root):
        return

    channel = None
    for child in root:
        if child.tag == "channel":
            channel = child
            break

    if channel is None:
        return

    items = []
    title = None
    image = None
    for child in channel:
        if child.tag == "item":
            items.append(child)
        elif child.tag == "title":
            title = child.text
        elif child.tag == "image":
            image = parse_image(child)

    if not len(items):
        return

    articles = []
    for item in items:
        article = parse_item(item, image)
        if article is not None:
            articles.append(article)
    article_res = Articles(articles=articles, title=title, image=image)
    return article_res 

@app.get("/proxy/")
def proxy(url: str):
    article = parse_article("https://" + url)
    json_article = jsonable_encoder(article)
    return JSONResponse(content=json_article) 

@app.get("/api/")
def home(url: str):
    articles = parse_data("https://" + url)
    print(articles)
    json_articles = jsonable_encoder(articles)

    return JSONResponse(content=json_articles)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082, log_level="debug")
