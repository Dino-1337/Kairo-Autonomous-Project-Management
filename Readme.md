# Kairo Autonomous Project Management

Kairo is a sophisticated, AI-driven project management platform designed to automate the transition from abstract ideas to structured execution. It functions as an intelligent coordination layer, utilizing Large Language Models to decompose project requests into actionable tasks, assign them based on team skill sets, and maintain a contextual narrative of project progress.

---

## Core Capabilities

### AI-Driven Task Decomposition
The system analyzes natural language inputs to identify core objectives and automatically generates a logical breakdown of tasks. Each task is defined with estimated durations, required skill sets, and suggested priorities to ensure a coherent project flow.

### Intelligent Resource Allocation
Using predefined team profiles, Kairo matches tasks to individual team members based on their specific technical expertise and current availability. This ensures that responsibilities are assigned to the most qualified personnel without manual oversite.

### Meeting Insights and Integration
Kairo provides dedicated support for meeting processing. Users can input raw meeting notes, which the system then analyzes to extract structured data, including:
- Key Decisions
- Action Items
- Identified Risks
- Future Feature Ideas
- Narrative Summaries

### Project Digest and Contextual Narrative
The Digest tab provides a high-level, chronological status report. It synthesizes project events, meeting outcomes, and idea status into a readable narrative, allowing stakeholders to quickly understand project velocity without reviewing individual task updates.

### Multidimensional Project Views
The platform offers several ways to visualize project data, including:
- Kanban Boards for workflow management.
- Dynamic Calendars for deadline tracking.
- Project Timelines for a granular log of system and user events.
- Reports for performance and progress metrics.

---


## Technical Architecture

### Backend (FastAPI / Python)
The backend is built as a modular REST API using FastAPI and SQLModel for robust data persistence.
- **Agents and Graph**: Leverages LangGraph and OpenRouter for complex AI workflows, including multi-stage task decomposition and assignment logic.
- **Service Layer**: Decoupled business logic for project management, slack integrations, and LLM orchestration.
- **Database**: Primary persistence via SQLite (local) or PostgreSQL, managed with SQLModel for consistent schema definitions across the implementation.

### Frontend (React / Vite)
The frontend is a high-performance Single Page Application (SPA).
- **Authentication**: Integrated with Clerk for secure, enterprise-grade user management.
- **State Management**: Uses TanStack Query (React Query) for efficient data fetching and synchronization with the backend.
- **Styling**: Built with Vanilla CSS and Tailwind CSS, utilizing a custom design token system for consistent implementation of the Warm Linen aesthetic.

---

## Project Structure

```text
ProjectManager/
├── backend/
│   ├── agents/           # LLM agent logic and OpenRouter clients
│   ├── core/             # Centralized configuration and authentication dependencies
│   ├── graph/            # LangGraph workflow definitions for task generation
│   ├── models/           # SQLModel schema definitions for the domain layer
│   ├── services/         # Business logic (Slack, AI, project coordination)
│   └── app.py            # Main FastAPI entry point and route definitions
│
└── frontend/
    ├── src/
    │   ├── components/   # Modular UI components (Cards, Forms, Modals)
    │   ├── pages/        # Route-level views (Workspace, Dashboard)
    │   ├── hooks/        # Custom React hooks for data fetching and state
    │   └── main.tsx      # Frontend entry point
```

---

## Getting Started

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- OpenRouter API Key
- Clerk Frontend and Backend credentials

### Backend Installation
1. Navigate to the backend directory.
2. Create and activate a virtual environment.
3. Install dependencies: `pip install -r requirements.txt`
4. Configure the `.env` file with required API keys.
5. Launch the server: `python app.py`

The backend interface will be accessible at `http://localhost:8000`.

### Frontend Installation
1. Navigate to the frontend directory.
2. Install dependencies: `npm install`
3. Launch the development server: `npm run dev`

The application will be accessible at `http://localhost:3000`.

---

## Security and Authentication
User authentication is managed via Clerk, ensuring that project data and workspace access are restricted to authorized personnel. Environment variables must be correctly configured in both the frontend and backend to facilitate secure JWT verification and user session management.