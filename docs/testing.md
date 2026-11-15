# BrandLens AI — Testing & Verification Strategy

## Testing Levels

### 1. Unit & Schema Tests
- Express route verification and validation schemas.
- Pydantic models in FastAPI (strict validation of `findings` payload, source ID enforcement).
- Mongoose models and field constraints.

### 2. Integration Tests
- Inter-service communication: Express to FastAPI health checks and review dispatch.
- Multi-tenancy isolation: Ensuring queries always filter by `organisationId`.
- Deterministic checks vs AI-assisted checks test fixtures.

### 3. Evaluation Dataset for Brand Checks (Milestone 5+)
- Controlled test cases:
  - Banned terms ("100% risk-free") -> flagged deterministically with approved replacement.
  - Tone mismatch -> flagged with cited tone guideline and intent-preserving rewrite.
  - Unsupported claims -> flagged as `UNSUPPORTED` without guessing citations.
  - Valid claims -> verified against active `approvedFacts` with exact passage citations.
  - Accessibility -> WCAG 2.1 contrast ratio calculation.

### 4. Milestone 1 Acceptance Criteria
- [x] Repository directory structure matches Blueprint Section 14.
- [x] Express backend starts, exposes `/api/health`, gracefully handles database connection.
- [x] FastAPI AI service starts, exposes `/health` and `/api/status`.
- [x] Frontend shell loads, provides branded navigation and real-time service health check monitoring.
- [x] Automated health check tests pass.
