# BrandLens AI — API Reference

## Base URLs
- **Backend API:** `http://localhost:5000/api`
- **AI Service:** `http://localhost:8000`

---

## 1. System & Health Endpoints
- `GET /api/health` — Backend health, system uptime, and database connection status.
- `GET /api/health/ai` — Backend check of AI service connectivity.
- `GET /health` (FastAPI) — AI service health check.
- `GET /api/status` (FastAPI) — AI service operational details and provider status.

---

## 2. Authentication & Sessions (Milestone 2)
- `POST /api/auth/register` — Register a new user.
- `POST /api/auth/login` — Sign in with email and password, returns JWT session.
- `POST /api/auth/logout` — Invalidate user session.
- `GET /api/auth/me` — Retrieve authenticated user profile and memberships.

---

## 3. Organisations & Workspaces (Milestone 2)
- `GET /api/organisations` — List user's accessible workspaces.
- `POST /api/organisations` — Create an organisation workspace.
- `GET /api/organisations/:organisationId/members` — List members and roles.
- `POST /api/organisations/:organisationId/invitations` — Invite a member.
- `PATCH /api/organisations/:organisationId/members/:memberId` — Update role (`ADMIN`, `MANAGER`, `REVIEWER`, `CREATOR`).

---

## 4. Brand Knowledge Base (Milestone 3)
- `GET /api/organisations/:organisationId/guidelines` — List brand guidelines.
- `POST /api/organisations/:organisationId/guidelines` — Create a guideline rule.
- `PATCH /api/guidelines/:guidelineId` — Update a guideline.
- `POST /api/guidelines/:guidelineId/versions` — Create a new version of a guideline.
- `GET /api/organisations/:organisationId/facts` — List approved facts.
- `POST /api/organisations/:organisationId/facts` — Create an approved fact.
- `PATCH /api/facts/:factId` — Update approved fact.
- `GET /api/organisations/:organisationId/terminology` — List terminology rules.
- `POST /api/organisations/:organisationId/terminology` — Create terminology rule.
- `GET /api/organisations/:organisationId/assets` — List brand visual assets.
- `POST /api/organisations/:organisationId/assets` — Upload brand asset metadata.

---

## 5. Content Submissions & Reviews (Milestones 4, 5, 6)
- `POST /api/organisations/:organisationId/contents` — Submit content draft.
- `GET /api/organisations/:organisationId/contents` — List submissions.
- `GET /api/contents/:contentId` — Get submission details.
- `POST /api/contents/:contentId/versions` — Submit revised draft version.
- `POST /api/contents/:contentId/reviews` — Trigger automated review run.
- `GET /api/contents/:contentId/reviews/:reviewId` — Get review findings.
- `POST /api/findings/:findingId/decision` — Accept, edit, or reject suggestion.
- `POST /api/contents/:contentId/comments` — Add comment to submission or finding.
- `POST /api/contents/:contentId/assignments` — Assign submission to reviewer.
- `POST /api/contents/:contentId/approval-requests` — Request formal sign-off.
- `POST /api/approval-requests/:requestId/decision` — Approve, request changes, or reject.

---

## 6. Insights & Audit (Milestones 7, 8)
- `GET /api/organisations/:organisationId/insights` — Aggregated governance metrics.
- `GET /api/organisations/:organisationId/audit-logs` — Immutable audit log trail.
- `GET /api/contents/:contentId/report` — Exportable pre-publication verification certificate.
