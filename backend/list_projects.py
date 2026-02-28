import requests

r = requests.get('http://127.0.0.1:8000/projects')
projects = r.json()
for p in projects:
    print(f"ID: {p['id']} | Name: {p['name']}")
