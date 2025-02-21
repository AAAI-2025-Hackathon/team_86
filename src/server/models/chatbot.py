from textwrap import dedent
from langchain.schema import AIMessage, SystemMessage, HumanMessage
from langchain_ollama.chat_models import ChatOllama
from server.lib.types import WebsiteCategory, Conversation, ModelName
from server.lib.utils import format_llm_response
from server.lib.constants import OLLAMA_URL, DEFAULT_GENAI_MODEL, NUM_CORES

class Chatbot:
    """Chatbot assistant that answers end users' questions about products and information through RAG"""
    def __init__(self) -> None:
        self._reset_history()
        self._add_sys_msg = lambda msg: self.history.append(SystemMessage(dedent(msg)))

    async def __call__(self, webpage_text: str, category: WebsiteCategory, model_name: ModelName = DEFAULT_GENAI_MODEL, conv: Conversation = []) -> str:
        self._parse_conversation(conv)
        return await self.chat(conv, webpage_text, category, model_name)


    async def chat(self, conv: Conversation, webpage_text: str, category: WebsiteCategory, model_name: ModelName) -> str:
        """Returns the LLM's response to the given prompt"""
        self.history.append(SystemMessage(dedent(f'''
            Webpage text:
            ```{webpage_text}```
            Webpage category: "{category}"
            Use the above as context when answering user questions. If the context is unnecessary, answer the question directly.
        ''')))
        if conv: self.history.append(HumanMessage(conv[-1]['message']))

        llm = ChatOllama(
            model=model_name,
            base_url=OLLAMA_URL.replace('/api/generate', ''),
            num_thread=NUM_CORES
        )

        try:
            response = llm.invoke(self.history).content
            response = format_llm_response(response)
            self._reset_history()
            return response
        except:
            return 'Sorry, something wrong has happened.'


    def _reset_history(self) -> None:
        """Resets the chatbot's conversation memory"""
        self.history = [SystemMessage('You are a helpful AI web assistant that assists users about their queries when they browse webpages.')]


    def _parse_conversation(self, conv: Conversation) -> None:
        """Loads the given conversation history from strings to chat schemas"""
        if len(conv) == 0: return
        for msg in conv[:-1]:
            sender, content = msg['sender'], msg['message']
            match sender:
                case 'AI': self.history.append(AIMessage(content))
                case 'System': self.history.append(SystemMessage(content))
                case 'You': self.history.append(HumanMessage(content))