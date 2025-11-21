import requests
import json

url = "http://localhost:8000/process-request"
payload = {
    "user_request": "Create a marketing plan for a new coffee brand",
    "urgency": False,
    "require_approval": False,
    "deadline": "None"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
