"""Validated page layouts; independent of the API and database runtime."""
from typing import Literal
from pydantic import BaseModel, Field, field_validator, model_validator

class BilingualText(BaseModel):
    en: str = ''
    ml: str | None = ''

class SEOSettings(BaseModel):
    title: str = Field(default='', max_length=180)
    description: str = Field(default='', max_length=400)
    image: str = ''
    noindex: bool = False

def safe_link(value):
    if value and not (value.startswith(('https://', 'mailto:', 'tel:')) or (value.startswith('/') and not value.startswith('//')) or value.startswith('#')):
        raise ValueError('Use a site path starting with / or an HTTPS, email or telephone link.')
    if '\\' in value or any(ord(c) < 32 for c in value):
        raise ValueError('Invalid link')
    return value

class PageItem(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    title: BilingualText = Field(default_factory=BilingualText)
    subtitle: BilingualText = Field(default_factory=BilingualText)
    body: BilingualText = Field(default_factory=BilingualText)
    image_url: str = ''
    image_alt: str = ''
    link_url: str = ''
    link_label: BilingualText = Field(default_factory=BilingualText)
    tag: str = ''
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    _links = field_validator('image_url', 'link_url')(safe_link)

class HeroSlide(BaseModel):
    project_slug: str = ''
    image_url: str = ''
    video_url: str = ''
    image_alt: str = ''
    _links = field_validator('image_url','video_url')(safe_link)


class PageHero(BaseModel):
    eyebrow: BilingualText = Field(default_factory=BilingualText)
    title: BilingualText = Field(default_factory=BilingualText)
    body: BilingualText = Field(default_factory=BilingualText)
    theme: Literal['light', 'dark'] = 'light'
    layout: Literal['split', 'text'] = 'split'
    image_url: str = ''
    video_url: str = ''
    image_alt: str = ''
    featured_project_slug: str = ''
    slides: list[HeroSlide] = Field(default_factory=list, max_length=6)
    image_position: Literal['center', 'top', 'bottom', 'left', 'right'] = 'center'
    primary_label: BilingualText = Field(default_factory=BilingualText)
    primary_url: str = ''
    secondary_label: BilingualText = Field(default_factory=BilingualText)
    secondary_url: str = ''
    _links = field_validator('image_url', 'video_url', 'primary_url', 'secondary_url')(safe_link)

class PageSection(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    type: Literal['text', 'cards', 'projects', 'locations', 'process', 'people', 'stats', 'faq', 'cta', 'testimonials', 'collaborators']
    enabled: bool = True
    eyebrow: BilingualText = Field(default_factory=BilingualText)
    title: BilingualText = Field(default_factory=BilingualText)
    body: BilingualText = Field(default_factory=BilingualText)
    theme: Literal['light', 'white', 'dark'] = 'light'
    image_url: str = ''
    image_alt: str = ''
    link_url: str = ''
    link_label: BilingualText = Field(default_factory=BilingualText)
    graphic_label: BilingualText = Field(default_factory=BilingualText)
    items: list[PageItem] = Field(default_factory=list, max_length=30)
    source: Literal['manual', 'services', 'about'] = 'manual'
    limit: int = Field(default=3, ge=1, le=12)
    selected_slugs: list[str] = Field(default_factory=list, max_length=30)
    project_type: str = ''
    _links = field_validator('image_url', 'link_url')(safe_link)

    @model_validator(mode='after')
    def unique_items(self):
        if len({i.id for i in self.items}) != len(self.items):
            raise ValueError('Item identifiers must be unique within a section.')
        return self

class PageDesign(BaseModel):
    layout_revision: int = 3
    version: Literal[2] = 2
    hero: PageHero
    sections: list[PageSection] = Field(default_factory=list, max_length=20)
    seo: SEOSettings = Field(default_factory=SEOSettings)
    status: Literal['draft', 'review', 'published', 'archived'] = 'draft'
    publication_reviewed: bool = False
    updated_at: str | None = None

    @model_validator(mode='after')
    def valid_page(self):
        if not self.hero.title.en.strip():
            raise ValueError('Add an English page heading.')
        if len({s.id for s in self.sections}) != len(self.sections):
            raise ValueError('Section identifiers must be unique.')
        return self
