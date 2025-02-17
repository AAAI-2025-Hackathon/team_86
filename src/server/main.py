from fastapi import FastAPI
from pydantic import HttpUrl
from server.model import website_clf, ai_assistant

app = FastAPI()

@app.post('/ai')
async def respond(url: HttpUrl) -> str:
    category = await website_clf.classify(url)
    return await ai_assistant.respond(category)