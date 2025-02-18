from textwrap import dedent
import re, httpx
from server.lib.types import ModelName
from server.lib.constants import DEFAULT_GENAI_MODEL

async def prompt_llm(prompt: str, llm_name: ModelName = DEFAULT_GENAI_MODEL) -> str:
    prompt = dedent(prompt)
    async with httpx.AsyncClient(timeout=240) as client:
        response = await client.post(
            'http://localhost:11434/api/generate',
            json={'model': llm_name, 'prompt': prompt, 'stream': False}
        )
        response = response.json()['response']
        response = re.sub(r'<think\b[^<]*(?:(?!<\/think>)<[^<]*)*<\/think>', '', response, flags=re.IGNORECASE) # Remove <think> tags
        return response