from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.lib.types import Conversation, ModelName
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
async def chat(webpage_text: str, model_name: ModelName = DEFAULT_GENAI_MODEL, conv: Conversation = []) -> str:
    category = await website_clf.classify(webpage_text, model, tokenizer)
    return await chatbot(webpage_text, category, model_name, conv)


@app.post('/ai/summarize')
async def summarize(webpage_text: str, model_name: ModelName = DEFAULT_GENAI_MODEL) -> str:
    category = await website_clf.classify(webpage_text, model, tokenizer)
    return await summarizer.summarize(webpage_text, category, model_name)


@app.post('/ai/fact_check')
async def fact_check(webpage_text: str, model_name: ModelName = DEFAULT_GENAI_MODEL) -> str:
    category = await website_clf.classify(webpage_text, model, tokenizer)
    return await fact_checker.fact_check(webpage_text, category, model_name)