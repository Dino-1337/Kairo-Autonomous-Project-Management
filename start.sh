#!/usr/bin/env bash

set -e

# Resolve project root (directory of this script)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo " Project root: $ROOT_DIR"

#
# 1) Start backend (FastAPI / Uvicorn)
#
echo " Starting backend..."
cd "$ROOT_DIR/backend"

if [ -d "venv" ]; then
  # Try Unix-style venv activation first, then Windows-style
  if [ -f "venv/bin/activate" ]; then
    # shellcheck disable=SC1091
    source "venv/bin/activate"
  elif [ -f "venv/Scripts/activate" ]; then
    # shellcheck disable=SC1091
    source "venv/Scripts/activate"
  else
    echo "️  Found venv directory but no activate script; continuing without activation."
  fi
else
  echo "️  No venv found in backend/. Make sure you've created one and installed requirements:"
  echo "    cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
fi

# Run the backend app (per README: python app.py)
python app.py &
BACKEND_PID=$!
echo " Backend started with PID $BACKEND_PID (http://localhost:8000)"

#
# 2) Start frontend (Vite dev server)
#
echo " Starting frontend..."
cd "$ROOT_DIR/frontend"

if [ ! -d "node_modules" ]; then
  echo " Installing frontend dependencies (npm install)..."
  npm install
fi

npm run dev &
FRONTEND_PID=$!
echo " Frontend started with PID $FRONTEND_PID (http://localhost:3000)"

#
# 3) Wait for both processes
#
echo ""
echo " Both backend and frontend are starting up."
echo "   - API:      http://localhost:8000"
echo "   - Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both."

wait $BACKEND_PID
wait $FRONTEND_PID

