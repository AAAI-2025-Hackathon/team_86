from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.lib.types import Conversation, ModelName
from server.lib.constants import DEFAULT_GENAI_MODEL
from server.models import website_clf, ai_assistant, summarizer, fact_checker

model, tokenizer = website_clf.load_model_and_tokenizer()
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_methods=['GET', 'POST', 'PUT', 'DELETE'],
    allow_headers=['*'],
    allow_credentials=True
)


@app.post('/ai/chat')
async def chat(html: str, webpage_text: str, model_name: ModelName = DEFAULT_GENAI_MODEL, conv: Conversation = []) -> str:
    category = await website_clf.classify(webpage_text, model, tokenizer)
    return await ai_assistant.chat(conv, html, category, model_name)


@app.post('/ai/summarize')
async def summarize(webpage_text: str, model_name: ModelName = DEFAULT_GENAI_MODEL) -> str:
    category = await website_clf.classify(webpage_text, model, tokenizer)
    return await summarizer.summarize(webpage_text, category, model_name)


@app.post('/ai/fact_check')
async def fact_check(webpage_text: str, model_name: ModelName = DEFAULT_GENAI_MODEL) -> str:
    category = await website_clf.classify(webpage_text, model, tokenizer)
    return await fact_checker.fact_check(webpage_text, category, model_name)