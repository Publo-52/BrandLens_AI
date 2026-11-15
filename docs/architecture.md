# BrandLens AI — System Architecture

## Overview
BrandLens AI is an explainable pre-publication brand governance and approval platform. It checks content against approved brand guidelines, facts, and assets, suggests intent-preserving corrections, and keeps authorised humans in control.

## High-Level Architecture Diagram
```text
Creator / Manager / Reviewer / Admin
                 |
                 v
       React + Tailwind Frontend (Port 5173)
                 |
                 v
        Node.js + Express API (Port 5000)
          |       |        |
          |       |        +---- Authentication / RBAC (JWT)
          |       +------------- Workflow / Comments / Audit Logs
          |
          +--------------------- MongoDB Atlas / Local Database
          |                       - Organisations & Users
          |                       - Guidelines & Facts
          |                       - Assets & Versions
          |                       - Submissions & Findings
          |                       - Embeddings / Vector Retrieval
          |
          +--------------------- Object Storage (Cloudinary / S3)
          |                       - PDF / DOCX / Image Originals
          |
          +--------------------- Python + FastAPI AI Service (Port 8000)
                                  - File parsing & OCR (pdfplumber, docx, Tesseract)
                                  - Deterministic checks (Terminology, WCAG contrast)
                                  - Retrieval of approved guideline & fact chunks
                                  - LLM analysis (Tone, Claim verification, Rewrites)
                                  - Structured, source-cited findings
```

## Layer Responsibilities

### 1. Frontend (`frontend/`)
- **Tech Stack:** React, Tailwind CSS, Vite.
- **Responsibilities:**
  - Responsive multi-role review workspace.
  - Interactive findings panel with source citations, severity, and confidence badges.
  - Side-by-side version comparison and diffs.
  - Accept, edit, or reject suggestion workflows with justification notes.
  - Admin knowledge base manager (guidelines, approved facts, terminology, brand assets).
  - Governance insights dashboard and audit log viewer.

### 2. Application API (`backend/`)
- **Tech Stack:** Node.js, Express, Mongoose.
- **Responsibilities:**
  - Multi-tenant organisation isolation (`organisationId` scoping).
  - Role-based access control (`ADMIN`, `MANAGER`, `REVIEWER`, `CREATOR`).
  - Brand knowledge CRUD and version management.
  - Content submission intake and version control.
  - Review orchestration with the FastAPI AI service.
  - Reviewer comments, assignments, overrides with mandatory reasons, and approval locking.
  - Append-only audit trail logging.

### 3. AI & Document Service (`ai-service/`)
- **Tech Stack:** Python 3.13, FastAPI, Uvicorn, Pydantic.
- **Responsibilities:**
  - Document extraction (PDF, DOCX, OCR for images).
  - Deterministic terminology engine (preferred vs banned terms, exact replacement).
  - Color contrast & accessibility verification (WCAG 2.1 compliance).
  - Grounded RAG retrieval of organisation-specific approved facts and guideline passages.
  - Tone & claim consistency analysis via LLM provider adapter.
  - Strict structured output validation (Pydantic models) enforcing exact source IDs.

### 4. Database Layer
- **Tech Stack:** MongoDB Atlas.
- **Responsibilities:**
  - Multi-tenant document storage.
  - Schema collections: `users`, `organisations`, `memberships`, `guidelines`, `approvedFacts`, `terminologyRules`, `assets`, `contents`, `contentVersions`, `reviews`, `comments`, `approvalRequests`, `auditLogs`.
  - Vector search index for semantic guideline/fact retrieval scoped by organisation.
