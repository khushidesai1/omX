#!/bin/bash
# Start the FastAPI backend server on port 8000

cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Start uvicorn on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
