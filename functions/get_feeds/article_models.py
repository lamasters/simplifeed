"""Models for news RSS feeds"""

import http
from typing import Optional

from pydantic import BaseModel, Field


class ArticleMetadata(BaseModel):
    """Model for an article entry in home feed"""

    title: str = Field(default="")
    link: str = Field(default="")
    pub_date: str = Field(default="")
    source: str = Field(default="")
    image_url: Optional[str] = Field(default=None)
    author: Optional[str] = Field(default=None)


class ArticleSource(BaseModel):
    """Model for an article source containing article entries"""

    articles: list[ArticleMetadata] = Field(default_factory=list)
    title: str = Field(default="")
    url: str = Field(default="")


class ArticleContent(BaseModel):
    """Model of a single article text content"""

    tags: list[str] = Field(default_factory=list)


class ArticleMetadataRes(BaseModel):
    """Response model for an article entry in home feed"""

    status: http.HTTPStatus = Field(default=http.HTTPStatus.OK)
    data: Optional[ArticleMetadata] = Field(default=None)


class ArticleSourceRes(BaseModel):
    """Response model for an article source containing article entries"""

    status: http.HTTPStatus = Field(default=http.HTTPStatus.OK)
    data: Optional[ArticleSource] = Field(default=None)
    message: Optional[str] = Field(default=None)


class ArticleContentRes(BaseModel):
    """Response model for article content"""

    status: http.HTTPStatus = Field(default=http.HTTPStatus.OK)
    data: Optional[ArticleContent] = Field(default=None)
