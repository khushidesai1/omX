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
GCS_PROJECT_ID=optional-default-project
GCS_CREDENTIALS_PATH=/absolute/path/to/service-account.json
GCS_SIGNED_URL_TTL_SECONDS=900
GCS_UPLOAD_URL_TTL_SECONDS=900
```

If you omit the file, the app falls back to `sqlite+aiosqlite:///./omx_dev.db` for development.

### Google Cloud Storage integration

The storage API expects a service account with the `storage.objects.*` permissions for any bucket you plan to link. Download the JSON key and point `GCS_CREDENTIALS_PATH` at the absolute file path (keep it out of version control). Alternatively, configure Workload Identity and leave `GCS_CREDENTIALS_PATH` unset if the environment already has application-default credentials. `GCS_PROJECT_ID` is optional—use it to set a default project, or omit it when your service account spans multiple projects.

Workflows:

1. **List available buckets** – `GET /api/workspaces/{workspace_id}/projects/{project_id}/storage/buckets?gcp_project_id=foo` (project query param optional; defaults to environment project)
2. **Link a bucket/prefix to a project** – `POST /storage/connections` with `{ "bucket_name": "my-bucket", "gcp_project_id": "foo", "prefix": "optional/prefix" }`
3. **Browse objects** – `GET /storage/objects?bucket=my-bucket&prefix=optional/prefix`
4. **Generate signed URLs** – `POST /storage/upload-url` or `/storage/download-url` with bucket/object metadata
5. **Delete objects** – `DELETE /storage/objects`

Each project now stores its GCS links in the `project_storage_connections` table (run `alembic upgrade head` to create it). The frontend can rely on these endpoints to populate the Finder-style browser and fetch signed URLs for upload/download flows.

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
