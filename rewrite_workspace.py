import re

file_path = 'z:/AI PROJECTS/ProjectManager/frontend/src/pages/Workspace.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace imports
content = content.replace('import { useAuth } from "@clerk/clerk-react";\n', '')
content = content.replace('import { useParams, Link } from "react-router-dom";', 'import { useParams, Link } from "react-router-dom";\nimport { useAuth } from "@clerk/clerk-react";')

# Insert apiFetch inside Workspace component
workspace_start = 'const Workspace = () => {'
apifetch_code = """const Workspace = () => {
  const { getToken } = useAuth();
  
  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken();
    const headers = { ...options.headers } as Record<string, string>;
    if (token) {
      headers['Authorization'] = f'Bearer {token}'; // wait this is JS template literal
    }
    return fetch(f'{API}{endpoint}', { ...options, headers });
  };
""".replace("f'Bearer {token}'", "`Bearer ${token}`").replace("f'{API}{endpoint}'", "`${API}${endpoint}`")

content = content.replace(workspace_start, apifetch_code)

# Replace fetch calls
content = re.sub(r'fetch\(`\$\{API\}([^`]+)`', r'apiFetch(`\1`', content)
content = re.sub(r'fetch\(`\$\{API_BASE\}([^`]+)`', r'apiFetch(`\1`', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("success")
