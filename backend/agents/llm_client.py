import os
import sys
import requests
import json

# Add the parent directory to Python path so we can import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from config.settings import settings
    print("✅ Successfully imported settings")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Current Python path:", sys.path)

class OpenRouterClient:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model = settings.DEEPSEEK_MODEL
        print(f"🤖 LLM Client initialized with model: {self.model}")
    
    def chat_completion(self, messages, temperature=0.1):
        """Send request to OpenRouter API"""
        if not self.api_key:
            print("❌ No OpenRouter API key found!")
            return None
            
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/your-repo",
            "X-Title": "Startup Agent"
        }
        
        data = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 2000
        }
        
        try:
            print(f"🤖 Calling {self.model} via OpenRouter...")
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                print("✅ LLM Response received")
                return content
            else:
                print(f"❌ OpenRouter Error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return None

# Test the LLM client directly
if __name__ == "__main__":
    print("🧪 Testing LLM Client...")
    client = OpenRouterClient()
    test_messages = [
        {"role": "user", "content": "Hello, who are you? Respond in one sentence."}
    ]
    response = client.chat_completion(test_messages)
    print("🤖 Response:", response)