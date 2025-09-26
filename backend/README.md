# omX Backend

This FastAPI service powers user authentication, workspace management, and project dashboards for omX. The codebase uses async SQLAlchemy with PostgreSQL (preferred) but defaults to a local SQLite database for quick starts.

## Prerequisites

- Python 3.11+
- PostgreSQL 14+ (or Docker for local database)
- (optional) `poetry` or `pipenv` if you prefer those over `pip`

## Installation

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## Configuration

Create a `.env` file in `backend/` with the following content (adjust values as needed):

```env
DATABASE_URL=postgresql+asyncpg://omx:omx@localhost:5432/omx
SECRET_KEY=replace-with-32-char-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:5173
```

If you omit the file, the app falls back to `sqlite+aiosqlite:///./omx_dev.db` for development.

## Database Migrations

1. Update the Alembic connection URL to match your environment (or rely on the `.env` override).
2. Create the database schema:

```bash
alembic upgrade head
```

To generate new migrations after changing models:

```bash
alembic revision --autogenerate -m "describe changes"
alembic upgrade head
```

## Running the API

```bash
uvicorn app.main:app --reload
```

The service exposes:

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Workspace CRUD and join flows under `/api/workspaces`
- Project management endpoints under `/api/workspaces/{workspace_id}/projects`

Visit `http://localhost:8000/docs` for interactive OpenAPI documentation.
