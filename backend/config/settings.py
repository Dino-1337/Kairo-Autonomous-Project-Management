import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # OpenRouter Configuration
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
    DEEPSEEK_MODEL = "deepseek/deepseek-chat"
    TEAM_CONFIG_PATH = "config/team_config.json"

# Create the instance that we'll import
settings = Settings()