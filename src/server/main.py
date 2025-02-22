from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from server.lib.types import Conversation, ModelName
from server.lib.utils import extract_text_from_html
from server.lib.constants import DEFAULT_GENAI_MODEL
from server.models import website_clf, summarizer, fact_checker
from server.models.chatbot import Chatbot

model, tokenizer = website_clf.load_model_and_tokenizer()
chatbot = Chatbot()
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_methods=['GET', 'POST', 'PUT', 'DELETE'],
    allow_headers=['*'],
    allow_credentials=True
)


@app.post('/ai/chat')
async def chat(html: str = Body(..., media_type='text/plain'), model_name: ModelName = DEFAULT_GENAI_MODEL, conv: Conversation = []) -> str:
    print(conv)
    webpage_text = extract_text_from_html(html)
    category = await website_clf.classify(webpage_text, model, tokenizer)
    return await chatbot(webpage_text, category, model_name, conv)


@app.post('/ai/summarize')
async def summarize(html: str = Body(..., media_type='text/plain'), model_name: ModelName = DEFAULT_GENAI_MODEL) -> str:
    webpage_text = extract_text_from_html(html)
    category = await website_clf.classify(webpage_text, model, tokenizer)
    return await summarizer.summarize(webpage_text, category, model_name)


@app.post('/ai/fact_check')
async def fact_check(html: str = Body(..., media_type='text/plain'), model_name: ModelName = DEFAULT_GENAI_MODEL) -> str:
    webpage_text = extract_text_from_html(html)
    category = await website_clf.classify(webpage_text, model, tokenizer)
    return await fact_checker.fact_check(webpage_text, category, model_name)