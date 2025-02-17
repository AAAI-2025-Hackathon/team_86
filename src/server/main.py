from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.lib.types import Conversation
from server.models import website_clf, ai_assistant

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
async def chat(html: str, keywords_list: list[str], conv: Conversation) -> str:
    category = await website_clf.classify(keywords_list, model, tokenizer)
    return await ai_assistant.chat(conv, html, category)