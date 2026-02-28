import os
import sys

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_openrouter import ChatOpenRouter

# Add the parent directory to Python path so we can import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from config.settings import settings
    print(" Successfully imported settings")
except ImportError as e:
    print(f" Import error: {e}")
    print("Current Python path:", sys.path)


def _to_langchain_messages(messages):
    """Convert OpenAI-style dict messages to LangChain message objects."""
    lc_messages = []
    for message in messages:
        role = message.get("role", "user")
        content = message.get("content", "")
        if role == "system":
            lc_messages.append(SystemMessage(content=content))
        elif role == "assistant":
            lc_messages.append(AIMessage(content=content))
        else:
            lc_messages.append(HumanMessage(content=content))
    return lc_messages


class OpenRouterClient:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model = settings.DEEPSEEK_MODEL

        if not self.api_key:
            print(" No OpenRouter API key found!")
            self.client = None
            return

        self.client = ChatOpenRouter(
            model=self.model,
            api_key=self.api_key,
            base_url=self.base_url,
            temperature=0.1,
            max_tokens=2000,
        )
        print(f" LangChain OpenRouter client initialized with model: {self.model}")
    
    def chat_completion(self, messages, temperature=0.1):
        """Send request to OpenRouter API via LangChain ChatOpenRouter."""
        if not self.client:
            return None

        lc_messages = _to_langchain_messages(messages)

        try:
            # Override temperature per-call if needed
            response = self.client.invoke(lc_messages, config={"temperature": temperature})
            content = response.content
            print(" LLM Response received via LangChain")
            return content
        except Exception as e:
            print(f" LangChain OpenRouter request failed: {e}")
            return None
        
# Test the LLM client directly
if __name__ == "__main__":
    print(" Testing LLM Client...")
    client = OpenRouterClient()
    test_messages = [
        {"role": "user", "content": "Hello, who are you? Respond in one sentence."}
    ]
    response = client.chat_completion(test_messages)
    print(" Response:", response)