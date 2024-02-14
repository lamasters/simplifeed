"""Models for podcast RSS feeds"""

import http
from typing import Optional

from pydantic import BaseModel, Field


class PodcastEpisode(BaseModel):
    """Model for a podcast episode"""

    title: str = Field(default="")
    source: str = Field(default="")
    image_url: Optional[str] = Field(default=None)
    audio: str = Field(default="")
    audio_type: str = Field(default="audio/mpeg")
    description: str = Field(default="")
    pub_date: str = Field(default="")
    authors: str = Field(default="")
    duration: str = Field(default="00:00")


class PodcastSource(BaseModel):
    """Model for a podcast source containing podcast episodes"""

    episodes: list[PodcastEpisode] = Field(default_factory=list)
    title: str = Field(default="")
    image_url: Optional[str] = Field(default=None)
    url: str = Field(default="")


class PodcastEpisodeRes(BaseModel):
    """Response model for a podcast episode"""

    status: http.HTTPStatus = Field(default=http.HTTPStatus.OK)
    data: Optional[PodcastEpisode] = Field(default=None)


class PodcastSourceRes(BaseModel):
    """Response model for a podcast source containing podcast episodes"""

    status: http.HTTPStatus = Field(default=http.HTTPStatus.OK)
    data: Optional[PodcastSource] = Field(default=None)
