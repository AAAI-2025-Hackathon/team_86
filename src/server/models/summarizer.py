from server.lib.types import WebsiteCategory, ModelName
from server.lib.utils import prompt_llm

PROMPT_TEMPLATE = '''
You are an AI that summarizes web content accurately and concisely while considering the webpage's category.

### **Summarization Process (Step-by-Step Reasoning)**
1. **Identify the Main Topic** – What is the webpage primarily about?
2. **Extract Key Points** – What are the most important facts, arguments, or insights?
3. **Understand the Category Context** – Since this page is about **{category}**, emphasize aspects that are most relevant to this field.
4. **Determine the Author's Purpose** – Is the webpage informative, persuasive, instructional, or news-related?
5. **Summarize in a Clear and Coherent Manner** – Ensure readability while preserving critical information.
6. **Provide a One-Sentence TL;DR** – A very brief version for quick understanding.

### **Category: {category}**
Here is the webpage content:

{webpage_text}

Now, follow the step-by-step process above and generate a category-aware summary.
'''

async def summarize(webpage_text: str, category: WebsiteCategory, model_name: ModelName) -> str:
    return await prompt_llm(
        PROMPT_TEMPLATE.format(webpage_text=webpage_text, category=category),
        model_name
    )