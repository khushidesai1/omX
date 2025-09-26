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

## Backend (optional)

The FastAPI service in `backend/` can be run independently if you need API endpoints:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

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
