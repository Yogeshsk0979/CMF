# CMF

## Structure
- `backend/` — Node.js + Express API server (ESM), Supabase client wired up
- `frontend/` — Vite + React + shadcn/ui app, Supabase client wired up

## Backend
```
cd backend
npm install   # already installed
npm run dev   # nodemon, http://localhost:5001
```
Fill in real values in `backend/.env` (copy from `backend/.env.example`):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Frontend
```
cd frontend
npm install   # already installed
npm run dev   # http://localhost:5173
```
Fill in real values in `frontend/.env` (copy from `frontend/.env.example`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Notes
- Backend defaults to port `5001` (port `5000` conflicts with macOS AirPlay Receiver).
- `GET /api/health` and `GET /api/health/supabase` are available for connectivity checks.
