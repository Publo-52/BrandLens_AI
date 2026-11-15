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
- [ ] **Milestone 2 — Authentication and Workspace Security**: Registration, login, JWT sessions, organisations, memberships, and role-based access control (ADMIN, MANAGER, REVIEWER, CREATOR).
- [ ] **Milestone 3 — Brand Knowledge Base**: Versioned guidelines, approved facts, terminology rules, and asset management.
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
