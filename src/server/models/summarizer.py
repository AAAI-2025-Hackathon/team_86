from server.lib.types import WebsiteCategory, ModelName
from server.lib.utils import prompt_llm

async def summarize(webpage_text: str, category: WebsiteCategory, model_name: ModelName) -> str:
    return await prompt_llm(f'''
        ```{webpage_text}```
        The above is text extracted from a website of category "{category}".
        Please generate and return only the concise summary of the website without any irrelevant words.
    ''', model_name)