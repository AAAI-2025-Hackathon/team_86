from typing import Literal, TypeAlias

WebsiteCategory: TypeAlias = Literal['Education', 'Travel', 'Sports', 'E-Commerce', 'Games', 'News', 'Health and Fitness', 'Computers and Technology', 'Food', 'Social Networking and Messaging']
ModelName: TypeAlias = Literal['deepseek-r1:1.5b', 'deepseek-r1:8b', 'llama3.1:8b']
Conversation: TypeAlias = list[dict[Literal['sender', 'message'], Literal['You', 'AI', 'System'] | str]]