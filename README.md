# BrandLens AI

> **Intelligent brand governance, before you publish.**

BrandLens AI is an explainable pre-publication review and approval platform that checks content against approved brand guidelines, facts, and assets, suggests intent-preserving corrections, and keeps authorised humans in control.

Developed by **Team ALGO_X** (Global Institute of Science and Technology):
- Ranjan Mondal (Full-stack)
- Sukhen Das (Full-stack)
- Joy Khatua (Database)
- Chandan Patra (Analysis, Testing & Research)

---

## Architecture Overview

```
BrandLens_AI/
├── frontend/     # React + Vite + Tailwind CSS Review Workspace Shell
├── backend/      # Node.js + Express API + Mongoose (Auth, RBAC, Governance)
├── ai-service/   # Python 3.13 + FastAPI + Pydantic (OCR, Deterministic & AI Checks)
├── docs/         # Architecture, API, Database, Testing, and Demo documentation
└── README.md
```

---

## Milestone Status

- [x] **Milestone 1 — Foundation**: Repository structure, frontend shell, Express API, FastAPI service, MongoDB connection configuration, environment examples, and health checks.
- [x] **Milestone 2 — Authentication and Workspace Security**: Registration, login, JWT sessions, organisations, memberships, and role-based access control (ADMIN, MANAGER, REVIEWER, CREATOR).
- [x] **Milestone 3 — Brand Knowledge Base**: Versioned guidelines, approved facts, terminology rules, and asset management.
- [ ] **Milestone 4 — Content Intake**: Multi-format text and file submission, parsing, and extraction.
- [ ] **Milestone 5 — Review Engine**: Deterministic checks, approved-fact retrieval, AI tone/claim analysis, and structured citations.
- [ ] **Milestone 6 — Suggestions and Human Workflow**: Intent-preserving suggestions, accept/edit/reject, comments, assignments, overrides, and approvals.
- [ ] **Milestone 7 — Visual Checks and Governance Insights**: Palette/logo checks, contrast/accessibility, and governance analytics.
- [ ] **Milestone 8 — Quality, Deployment and Demo**: Test suite, report exports, production deployment, and presentation artifacts.

---

## Quick Start (Local Development)

### Prerequisites
- Node.js >= 18 (Tested on v24.14)
- Python >= 3.10 (Tested on 3.13.5)
- MongoDB Atlas account or local MongoDB instance

### 1. Backend Service
```bash
cd backend
npm install
cp .env.example .env
npm run dev
# Running on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 2. AI & Document Service
```bash
cd ai-service
# (Optional) Create virtual environment
# python -m venv venv && .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Running on http://localhost:8000
# Health check: http://localhost:8000/health
# Docs: http://localhost:8000/docs
```

### 3. Frontend Application
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# Running on http://localhost:5173
```

---

## Environment Configuration

Each service uses its own `.env` file loaded at startup. Template files with safe placeholders and inline documentation are provided for every service:

- `backend/.env.example` -> copy to `backend/.env`
- `ai-service/.env.example` -> copy to `ai-service/.env`
- `frontend/.env.example` -> copy to `frontend/.env`

**Copy templates (macOS / Linux / Git Bash):**
```bash
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
cp frontend/.env.example frontend/.env
```

**Copy templates (Windows PowerShell):**
```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item ai-service\.env.example ai-service\.env
Copy-Item frontend\.env.example frontend\.env
```

### 1. Backend (`backend/.env`)

| Variable | Required | Description |
| :--- | :---: | :--- |
| `NODE_ENV` | No | Runtime mode (`development`, `production`, or `test`). Default: `development`. |
| `PORT` | No | Express API listen port. Default: `5000`. |
| `FRONTEND_ORIGIN` | Yes | Allowed frontend origin for CORS (e.g., `http://localhost:5173`). |
| `MONGODB_URI` | Yes | MongoDB connection string (local or MongoDB Atlas URI). |
| `JWT_SECRET` | Yes | Strong secret key used to sign and verify JWT session tokens. |
| `AI_SERVICE_URL` | Yes | Base URL of the FastAPI AI & extraction service (e.g., `http://localhost:8000`). |
| `AI_SERVICE_API_KEY` | Yes | Shared key for authenticating requests to the AI service. |
| `CLOUDINARY_URL` | Optional* | Full Cloudinary URI (`cloudinary://<api_key>:<api_secret>@<cloud_name>`). Overrides individual Cloudinary keys if set. |
| `CLOUDINARY_CLOUD_NAME` | Optional* | Cloudinary cloud name for uploaded files (used if `CLOUDINARY_URL` is unset). |
| `CLOUDINARY_API_KEY` | Optional* | Cloudinary API key (used if `CLOUDINARY_URL` is unset). |
| `CLOUDINARY_API_SECRET` | Optional* | Cloudinary API secret (used if `CLOUDINARY_URL` is unset). |
| `FIREBASE_PROJECT_ID` | Yes (Auth) | Firebase project ID for Firebase Admin SDK token verification. |
| `FIREBASE_CLIENT_EMAIL` | Yes (Auth) | Firebase Admin service account client email. |
| `FIREBASE_PRIVATE_KEY` | Yes (Auth) | Firebase Admin service account private key (quoted PEM string with `\n` escapes). |

> \* Configure either `CLOUDINARY_URL` or the three individual `CLOUDINARY_*` keys to enable cloud asset storage.

### 2. Frontend (`frontend/.env`)

> Only variables prefixed with `VITE_` are exposed to the browser bundle by Vite. Never put server-only secrets in `frontend/.env`.

| Variable | Required | Description |
| :--- | :---: | :--- |
| `VITE_DEV_API_URL` | No | Backend API URL for local `npm run dev` (defaults to `http://<current-host>:5000`). |
| `VITE_API_BASE_URL` | Yes (Prod) | Backend API URL baked into production builds (`npm run build`). |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase Web App API key. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth domain (`<project-id>.firebaseapp.com`). |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase Cloud Storage bucket. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase Cloud Messaging sender ID. |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase Web App ID. |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | Optional Google Analytics Measurement ID for Firebase Analytics. |

### 3. AI & Document Extraction Service (`ai-service/.env`)

| Variable | Required | Description |
| :--- | :---: | :--- |
| `ENVIRONMENT` | No | Runtime mode (`development` or `production`). Default: `development`. |
| `PORT` | No | FastAPI / Uvicorn server port. Default: `8000`. |
| `MONGODB_URI` | Optional | MongoDB connection string for shared knowledge retrieval. |
| `AI_PROVIDER` | No | LLM provider identifier (e.g., `gemini`, `openai`). Default: `gemini`. |
| `AI_API_KEY` | Yes (AI) | API key for the configured AI provider. |
| `AI_MODEL` | No | Primary generative model name. Default: `gemini-1.5-pro`. |
| `EMBEDDING_MODEL` | No | Embedding model name for semantic retrieval. Default: `text-embedding-004`. |
| `AI_SERVICE_API_KEY` | Optional | Shared secret key matching backend `AI_SERVICE_API_KEY`. |

### Security & `.gitignore` Policy
- Real `.env` files (`.env`, `.env.local`, `.env.development`, `.env.production`, etc.) and Firebase service account JSON files (`*-firebase-adminsdk-*.json`, `firebase-service-account.json`) are excluded in `.gitignore`.
- Never commit real API keys, database passwords, JWT secrets, or private keys into git. Only commit `.env.example` files with safe placeholder values.
