from typing import Literal

WebsiteCategory = Literal['Education', 'Travel', 'Sports', 'E-Commerce', 'Games', 'News', 'Health and Fitness', 'Computers and Technology', 'Food', 'Social Networking and Messaging']
ModelName = Literal['deepseek-r1:1.5b', 'deepseek-r1:8b', 'llama3.1:8b']
Conversation = list[dict[Literal['user', 'ai', 'system'], str]]