This project is currently incomplete.

# 🚀 Startup Agent

AI-powered project coordination that transforms ideas into actionable plans with automatic team assignments and Slack notifications.

---

<img width="1025" height="592" alt="Screenshot 2025-11-19 154234" src="https://github.com/user-attachments/assets/f48117ea-e318-4edf-86f1-2f41763e48f1" />
<img width="1918" height="956" alt="Screenshot 2025-11-19 154439" src="https://github.com/user-attachments/assets/8d3e42f2-2bb7-486d-9b1e-97980eff62bc" />

## 🎯 What It Does

- **AI Task Decomposition** - Breaks requests into executable tasks
- **Smart Team Assignment** - Matches tasks to team members based on skills  
- **Slack Integration** - Automatic notifications and project coordination
- **Professional UI** - Enterprise-grade project management interface

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Add to .env:
# OPENROUTER_API_KEY=your_key_here
# SLACK_BOT_TOKEN=xoxb-your_token_here

python app.py
Frontend Setup
bash
cd frontend
npm install
npm run dev
📁 Project Structure
text
backend/
├── agents/           # AI agents
├── config/           # Team & project settings
└── app.py           # FastAPI server

frontend/
├── src/App.jsx      # React interface
└── package.json
🎛️ Features
Project Manager Controls
Urgency Levels: 🐢 Low → 🔥 Critical

Timeline Control: Normal vs Aggressive

Resource Allocation: Lean to Full team

Approval Workflows: Auto-assign or Manual review

Multi-channel Notifications: Slack, Email, Both

AI Coordination
Natural language project requests

4-6 actionable tasks per project

Skill-based team matching

Realistic time estimates (2-8 hours per task)