from transformers import DistilBertForSequenceClassification, DistilBertTokenizer
from pydantic import HttpUrl
from server.lib.types import WebsiteCategory


async def _fetch_html(url: HttpUrl) -> str:
    ...


async def _extract_keywords(html: str) -> list[str]:
    ...


async def _load_latest() -> tuple[DistilBertForSequenceClassification, DistilBertTokenizer]:
    ...


async def classify(url: HttpUrl) -> WebsiteCategory:
    html = await _fetch_html(url)
    keywords = await _extract_keywords(html)
    model, tokenizer = await _load_latest()