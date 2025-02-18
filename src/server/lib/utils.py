from textwrap import dedent
import re, httpx
from server.lib.types import LLMName

async def prompt_llm(prompt: str, llm_name: LLMName = 'deepseek-r1:1.5b') -> str:
    BASE_PROMPT = dedent('''
        You are 
    ''')
    prompt = BASE_PROMPT + '\n\n' + dedent(prompt)
    async with httpx.AsyncClient(timeout=240) as client:
        response = await client.post(
            'http://localhost:11434/api/generate',
            json={'model': llm_name, 'prompt': prompt, 'stream': False}
        )
        # Remove <think> tags
        response = response.json()['response']
        response = re.sub(r'<think\b[^<]*(?:(?!<\/think>)<[^<]*)*<\/think>', '', response, flags=re.IGNORECASE)
        return response