from typing import Literal

WebsiteCategory = Literal['Education', 'Travel', 'Sports', 'E-Commerce', 'Games', 'News', 'Health and Fitness', 'Computers and Technology', 'Food', 'Social Networking and Messaging']
LLMName = Literal['deepseek-r1:1.5b', 'deepseek-r1:8b', 'mistral']
Conversation = list[dict[Literal['user', 'ai', 'system'], str]]