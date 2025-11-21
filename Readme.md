# 🚀 Autonomous Project Manager

**AI-powered autonomous project coordination that transforms ideas into actionable plans with automatic team assignments and Slack notifications.**

This system acts as an intelligent layer between project requests and your team, automatically breaking down complex goals into specific, skill-based tasks and assigning them to the right people.

---

<img width="1908" height="933" alt="Dashboard View" src="https://github.com/user-attachments/assets/825b140b-1aca-407a-bb43-c63413686796" />
<img width="1906" height="943" alt="Task Generation" src="https://github.com/user-attachments/assets/d9f5a056-70c5-4ecc-88a8-e970ad8bd026" />

## 🎯 Key Features

- **🤖 AI Task Decomposition**: Automatically analyzes natural language requests and breaks them down into 4-6 actionable, logical tasks.
- **🧠 Smart Skill Matching**: Assigns tasks to team members based on their specific skill sets (e.g., assigning "API Design" to a Backend Engineer).
- **⚡ Autonomous Coordination**: Handles the "Project Manager" role by estimating hours, setting dependencies, and determining urgency.
- **💬 Slack Integration**: Instantly notifies the team via Slack when tasks are assigned.
- **✨ Modern UI**: A beautiful, responsive interface built with React and Tailwind CSS for managing the workspace.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS, Shadcn UI
- **Icons**: Lucide React
- **State/Routing**: React Router, TanStack Query

### Backend
- **API**: FastAPI (Python)
- **AI/LLM**: OpenRouter (DeepSeek/Mistral models)
- **Integration**: Slack SDK
- **Server**: Uvicorn

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites
- Python 3.8+
- Node.js 16+
- An OpenRouter API Key
- A Slack Bot Token (optional, for notifications)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment
# Create a .env file in /backend with:
# OPENROUTER_API_KEY=your_key_here
# SLACK_BOT_TOKEN=xoxb-your_token_here

# Run Server
python app.py
```
The backend will start on `http://localhost:8000`.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Development Server
npm run dev
```
The frontend will start on `http://localhost:3000`.

## 📁 Project Structure

```text
ProjectManager/
├── backend/
│   ├── agents/           # AI Logic (Decomposer, Assigner)
│   ├── config/           # Team profiles & constraints
│   ├── app.py            # Main FastAPI application
│   └── requirements.txt  # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── components/   # Reusable UI components
    │   ├── pages/        # Home, Workspace, etc.
    │   └── App.tsx       # Main entry point
    └── package.json      # Node dependencies
```

## 🎛️ How It Works

1.  **Input**: Enter a project idea (e.g., "Launch a new marketing campaign for Q4").
2.  **Decomposition**: The AI analyzes the request and breaks it down into sub-tasks (Design, Copywriting, Analytics setup).
3.  **Assignment**: It checks the `team_config.json` to find the best match for each task based on skills.
4.  **Output**: A structured plan is generated, displayed on the UI, and sent to Slack.