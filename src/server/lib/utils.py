from textwrap import dedent
import re, httpx
from server.lib.types import ModelName
from server.lib.constants import DEFAULT_GENAI_MODEL, OLLAMA_URL

async def format_llm_response(response: str) -> str:
    # Removes <think> tags
    response = re.sub(r'<think\b[^<]*(?:(?!<\/think>)<[^<]*)*<\/think>', '', response, flags=re.IGNORECASE)
    # Removes leading and trailing newline chars
    response = response.strip()
    return response


async def prompt_llm(prompt: str, llm_name: ModelName = DEFAULT_GENAI_MODEL) -> str:
    prompt = dedent(prompt)
    async with httpx.AsyncClient(timeout=240) as client:
        response = await client.post(
            OLLAMA_URL,
            json={'model': llm_name, 'prompt': prompt, 'stream': False}
        )
        response = response.json()['response']
        return format_llm_response(response)