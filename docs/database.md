# BrandLens AI — Database Schema & Data Models

## Technology
- **Database:** MongoDB Atlas
- **Driver:** Mongoose ODM (Node.js) / Motor or PyMongo (Python if needed)
- **Multi-Tenancy Isolation:** Strict scoping via `organisationId` on all tenant records.

---

## Collections Overview

### 1. `users`
Represents platform users.
- `_id`: ObjectId
- `name`: String
- `email`: String (Unique index)
- `passwordHash`: String (bcrypt)
- `isActive`: Boolean
- `createdAt`, `updatedAt`: Timestamps

### 2. `organisations`
Workspaces for brand teams.
- `_id`: ObjectId
- `name`: String
- `slug`: String (Unique index)
- `logoAssetId`: ObjectId (optional)
- `settings`: Object (`defaultLanguage`, `retentionDays`, `aiProviderConfig`)
- `createdAt`, `updatedAt`: Timestamps

### 3. `memberships`
Role binding between users and organisations.
- `_id`: ObjectId
- `organisationId`: ObjectId (Ref: organisations)
- `userId`: ObjectId (Ref: users)
- `role`: Enum (`ADMIN`, `MANAGER`, `REVIEWER`, `CREATOR`)
- `status`: Enum (`INVITED`, `ACTIVE`, `SUSPENDED`)
- Index: `{ organisationId: 1, userId: 1 }` (Unique)

### 4. `guidelines`
Versioned rules for tone, messaging, visual, legal.
- `_id`: ObjectId
- `organisationId`: ObjectId
- `title`: String
- `category`: Enum (`TONE`, `MESSAGING`, `VISUAL`, `ACCESSIBILITY`, `LEGAL`, `OTHER`)
- `ruleText`: String
- `severity`: Enum (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `sourceDocumentId`: ObjectId (optional)
- `sourceLocation`: String
- `version`: Number
- `ownerId`: ObjectId
- `status`: Enum (`DRAFT`, `ACTIVE`, `ARCHIVED`)
- `effectiveFrom`, `effectiveUntil`: Dates

### 5. `approvedFacts`
Factual source of truth for claims verification.
- `_id`: ObjectId
- `organisationId`: ObjectId
- `statement`: String
- `sourceDocumentId`: ObjectId (optional)
- `sourceReference`: String
- `applicability`: Object (`product`, `region`, `channel`)
- `version`: Number
- `status`: Enum (`DRAFT`, `ACTIVE`, `EXPIRED`, `SUPERSEDED`)
- `effectiveFrom`, `expiresAt`: Dates
- `ownerId`: ObjectId

### 6. `terminologyRules`
Deterministic vocabulary rules.
- `_id`: ObjectId
- `organisationId`: ObjectId
- `preferredTerm`: String
- `bannedTerms`: [String]
- `replacement`: String
- `explanation`: String
- `caseSensitive`: Boolean
- `scope`: String
- `isActive`: Boolean

### 7. `assets`
Brand visual assets (logos, colors, typography).
- `_id`: ObjectId
- `organisationId`: ObjectId
- `name`: String
- `type`: Enum (`LOGO`, `PALETTE`, `FONT`, `IMAGE`, `OTHER`)
- `storageKey`: String
- `secureUrl`: String
- `metadata`: Mixed
- `isActive`: Boolean

### 8. `contents` & `contentVersions`
Submissions and immutable version snapshots.
- `contents`:
  - `_id`, `organisationId`, `title`, `channel`, `audience`, `createdBy`, `assignedTo`, `currentVersionId`, `status` (`DRAFT`, `AUTO_CHECKED`, `CHANGES_REQUESTED`, `IN_REVIEW`, `APPROVED`, `PUBLISHED`, `REJECTED`), timestamps.
- `contentVersions`:
  - `_id`, `organisationId`, `contentId`, `versionNumber`, `text`, `fileReferences`: [], `changeSummary`, `createdBy`, timestamps.

### 9. `reviews`
Automated check executions and structured findings.
- `_id`, `organisationId`, `contentId`, `contentVersionId`, `status`
- `findings`: Array of:
  - `type`: Enum (`TERMINOLOGY`, `TONE_MISMATCH`, `CLAIM_UNSUPPORTED`, `CLAIM_CONTRADICTED`, `CONTRAST_FAIL`, `ALT_TEXT_MISSING`, etc.)
  - `severity`: Enum (`INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  - `confidence`: Number (0.0 to 1.0)
  - `location`: `{ start: Number, end: Number, page: Number }`
  - `originalText`: String
  - `explanation`: String
  - `sourceReferences`: Array of `{ sourceType, sourceId, quote }`
  - `suggestedCorrection`: String
  - `checkMethod`: Enum (`DETERMINISTIC`, `AI`)
  - `reviewStatus`: Enum (`PENDING`, `ACCEPTED`, `EDITED`, `REJECTED`, `OVERRIDDEN`)
- `processingMetadata`: `{ modelProvider, modelName, completedAt }`

### 10. `comments`, `approvalRequests`, `auditLogs`
- `comments`: Collaboration threads on submissions and individual findings.
- `approvalRequests`: Formal review sign-off records with timestamp, approver, and decision rationale.
- `auditLogs`: Append-only event stream (`actorId`, `action`, `entityType`, `entityId`, `before`, `after`, `reason`, `createdAt`).
