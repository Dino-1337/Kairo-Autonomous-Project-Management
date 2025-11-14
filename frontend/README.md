 Run the Project
Backend Setup
bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate 
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Add to .env file:
# OPENROUTER_API_KEY=your_key_here
# SLACK_BOT_TOKEN=xoxb-your_token_here

# Start backend server
python app.py
Frontend Setup
bash
cd frontend

# Install dependencies
npm install

# Start frontend
npm run dev
🧪 Test Components
Test Individual Agents
bash
cd backend

# Test task decomposition
python -m agents.task_decomposer

# Test team assignment
python -m agents.assignment_engine

# Test Slack connection
python -m agents.slack_agent
Test API Endpoints
bash
# Health check
curl http://localhost:8000/health

# Process request
curl -X POST "http://localhost:8000/process-request" \
  -H "Content-Type: application/json" \
  -d '{"user_request": "Build landing page for our product"}'
🌐 Access the Application
Frontend: http://localhost:3000

Backend API: http://localhost:8000

API Docs: http://localhost:8000/docs

📁 Key Files
backend/app.py - Main FastAPI server

backend/agents/ - AI agent modules

backend/config/ - Team and project configuration

frontend/src/App.jsx - React frontend

frontend/src/index.css - Styling

Server runs on port 8000, Frontend on port 3000 
