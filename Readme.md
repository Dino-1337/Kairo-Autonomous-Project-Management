# Kairo Autonomous Project Management

Kairo is an AI-driven project coordination layer. It automates the transition from abstract ideas to structured execution by decomposing project requests into actionable tasks and securely assigning them based on team skill sets.

## Key Features

- **AI Task Decomposition**: Breaks natural language inputs into logical, estimated tasks.
- **Intelligent Routing**: Matches tasks to team members based on defined expertise and workloads.
- **Meeting Insights**: Extracts decisions, risks, and action items directly from raw meeting notes.
- **Automated Narratives**: Generates a high-level chronological digest of project velocity and status.
- **Dynamic Views**: Offers Kanban, calendar, timeline, and reporting interfaces.

## Technical Architecture

### Backend Agent Workflow

```text
React Frontend → POST /process-request
               ↓
          FastAPI (app.py)
               ↓
         MasterOrchestrator
          (Identify Intent)
               ↓
       TaskDecompositionAgent
          (OpenRouter/LLM)
               ↓
        AssignmentEngine
      (Match Team Skills)
               ↓
    React Frontend (User Approves)
               ↓
React Frontend → POST /confirm-assignments
               ↓
          FastAPI (app.py)
               ↓
            SlackAgent
        ↓ fan-out (parallel)
    ┌──────────┴──────────┐
    ↓                     ↓
post_channel_msg      send_task_assignment
(Project Channel)      (Direct Messages)
```

### Stack Overview

**Backend**
- Framework: FastAPI, SQLModel.
- AI Logic: LangGraph, OpenRouter (DeepSeek/Mistral models).
- Database: SQLite/PostgreSQL.

**Frontend**
- Framework: React (Vite), Tailwind CSS.
- State Management: TanStack Query (React Query).
- Auth: Clerk authentication.

## Project Structure

```text
ProjectManager/
├── backend/
│   ├── agents/           # LLM agent logic and OpenRouter clients
│   ├── core/             # Centralized configuration and authentication
│   ├── graph/            # LangGraph workflow definitions for task generation
│   ├── models/           # SQLModel schema definitions
│   ├── services/         # Business logic (Slack, AI, project coordination)
│   └── app.py            # Main FastAPI entry point
│
└── frontend/
    ├── src/
    │   ├── components/   # Modular UI components
    │   ├── pages/        # Route-level views (Workspace, Dashboard)
    │   ├── hooks/        # Custom React hooks
    │   └── main.tsx      # Frontend entry point
```

## Quick Start

**Prerequisites**: Python 3.8+, Node.js 16+, Clerk Credentials, OpenRouter API Key.

**Backend Setup**
1. `cd backend`
2. Create and activate a virtual environment.
3. `pip install -r requirements.txt`
4. Add API keys to `.env` (OpenRouter, Clerk, Slack).
5. Run `python app.py` (Starts at http://localhost:8000)

**Frontend Setup**
1. `cd frontend`
2. `npm install`
3. Run `npm run dev` (Starts at http://localhost:3000)

## Security

User authentication is managed via Clerk to secure workspace access and data. Ensure frontend and backend environments have the matching Clerk keys properly configured for JWT validation.