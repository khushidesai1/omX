# omX Web App

A TypeScript + Tailwind marketing and authentication experience for the omX platform. The frontend is built with Vite and is intended to be hosted on Vercel (or any static host) while the FastAPI backend remains available for future API work.

## Frontend

```bash
cd frontend
npm install
npm run dev   # local development on http://localhost:5173
npm run build # outputs static bundle to frontend/dist
```

### Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, create a new project and choose this repo.
3. Set the project root to `frontend`.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy — the `vercel.json` rewrite ensures client-side routing works.

## Backend

The FastAPI service in `backend/` provides API endpoints for authentication and data management:

```bash
cd backend
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
./start.sh  # or: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend runs on **port 8000** by default.

### CORS Configuration for Cascade

The backend is configured to work with Cascade, which may use dynamic ports. The CORS settings in `backend/.env` include:

- **CORS_ORIGINS**: Specific allowed origins (e.g., `http://localhost:58530,http://localhost:5173`)
- **CORS_ORIGIN_REGEX**: Regex pattern to allow any localhost port (useful for Cascade)

This ensures the backend works regardless of which port Cascade chooses:

```bash
CORS_ORIGIN_REGEX=^http://localhost:[0-9]+$
```

**Note**: This regex only allows `http://localhost:*` origins for security. External origins must be explicitly listed in `CORS_ORIGINS`.

## Project Structure

- `frontend/` – Marketing + auth UI (Vite, React, Tailwind).
- `backend/` – FastAPI example backend.
- `vercel.json` – SPA rewrites for Vercel deployments.

## Scripts

- `npm run dev` – Start Vite dev server.
- `npm run build` – Generate production bundle.
- `npm run lint` – Lint the frontend source.

## Notes

- The repository previously relied on Streamlit; that integration has been removed.
- Customize the Tailwind tokens in `frontend/src/index.css` to tweak typography or color palette (currently centered on #9EB8A0).
