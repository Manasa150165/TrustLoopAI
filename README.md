# TrustLoop AI

TrustLoop AI is a multi-agent code verification dashboard that lets users sign in, submit code, run automated review checks, and view findings, recommendations, and saved history.

## Project overview

This project is built as a working MVP for an AI-powered code review workflow. It includes:

- React frontend with login, dashboard, reports, settings, and profile screens
- FastAPI backend with authentication and analysis APIs
- SQLite database for storing users and analysis history
- Multi-agent review logic that combines rule-based checks with LLM-style analysis output
- Local fallback behavior when no external AI key is configured

## Tech stack

- Frontend: React + Vite
- Backend: FastAPI + Python
- Database: SQLite + SQLAlchemy
- Authentication: JWT + password hashing with passlib/bcrypt
- AI layer: OpenAI/Gemini integration with mock fallback

## Project structure

- backend/app/ – API, auth, database, analysis, and LLM logic
- backend/tests/ – API and auth regression checks
- frontend/src/ – dashboard UI and routing
- frontend/vite.config.js – Vite dev server config
- .env.example – sample env values
- trustloop.db – SQLite database file

## Quick start

### 1. Create and activate the environment

From the workspace root:

```bash
python -m venv .venv
.venv\Scripts\activate
```

### 2. Install dependencies

```bash
cd backend
python -m pip install -r requirements.txt
```

### 3. Start the backend

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Start the frontend

In a second terminal:

```bash
dcd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Then open the frontend URL shown by Vite, usually:

- http://localhost:5173

## Demo flow

1. Sign up or log in
2. Paste code into the dashboard editor
3. Select language and set review requirements
4. Run analysis
5. View findings, suggested fixes, and recent saved history

## API endpoints

- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me
- POST /api/analyze
- GET /api/history
- GET /health

## Environment variables

Copy .env.example to a local .env file and add keys if you want live AI review:

```bash
OPENAI_API_KEY=
GEMINI_API_KEY=
SECRET_KEY=trustloop-secret-key
DATABASE_URL=sqlite:///./trustloop.db
```

## Verification

Backend test check:

```bash
cd backend
python -m pytest -q
```

Frontend build check:

```bash
cd frontend
npm run build
```

## Status

This project is a working MVP and is suitable for demo, internal evaluation, and handoff. It is not a production-grade enterprise system yet, but it demonstrates the full flow of login, code review, AI-assisted findings, and history tracking.
