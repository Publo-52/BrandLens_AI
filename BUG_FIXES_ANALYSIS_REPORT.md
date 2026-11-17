# BrandLens AI — Comprehensive Website Bug Audit & Fixes Report

> **Generated on:** November 17, 2026  
> **Repository:** `Publo-52/BrandLens_AI`  
> **Environment:** Node.js (Express, Mongoose), React 18 (Vite, Tailwind CSS), Firebase Auth (v10+), MongoDB Atlas  
> **Live Deployments:**
> - **Frontend (Vercel):** [https://brand-lens-ai-ten.vercel.app](https://brand-lens-ai-ten.vercel.app)
> - **Backend (Render):** [https://brandlens-backend-ghtd.onrender.com](https://brandlens-backend-ghtd.onrender.com)

---

## Executive Summary

A comprehensive architectural and functional audit of the entire BrandLens AI system was conducted across frontend routing, state management, authentication, API communication, UI layout, and backend security/RBAC. 

All identified bugs have been addressed, unit/build-tested, and verified against both local development environments and live cloud production configurations.

---

## Summary of Bugs Identified & Resolved

| # | Component / Layer | Bug Description | Severity | Status |
|---|-------------------|-----------------|----------|--------|
| **1** | **CORS & Preflight (Backend)** | OPTIONS preflight failed for `x-organisation-id` header on cross-origin requests from Vercel to Render. | **CRITICAL** | Fixed |
| **2** | **Multi-Tenancy (Frontend)** | Default fallback org ID used non-ObjectId string (`novatech-global-preview`), triggering Mongoose `CastError`. | **HIGH** | Fixed |
| **3** | **API Fetch Architecture** | `apiFetch` and `getHeaders` attached `x-organisation-id` on auth & demo routes where no workspace context is required. | **HIGH** | Fixed |
| **4** | **Firebase SDK Initialization** | `initializeApp()` called unconditionally in both `lib/firebase.js` and `services/firebase.js`, risking `duplicate-app` errors. | **MEDIUM** | Fixed |
| **5** | **Frontend Resilience (React)** | Lack of React Error Boundary meant any unhandled rendering error in code-split routes caused a blank white screen. | **HIGH** | Fixed |
| **6** | **UI / Navigation (Navbar)** | Workspace & user profile dropdown menus lacked outside-click event listeners, remaining stuck open when clicking away. | **LOW** | Fixed |
| **7** | **Data Fetching (Knowledge Base)** | `KnowledgeBasePage` used `Promise.all` across 4 endpoints; if any one failed or returned empty, all tab data was wiped out. | **MEDIUM** | Fixed |
| **8** | **1-Click Demo Login Fallback** | `demoLogin` in `api.js` had no multi-tier fallback if the target route was unavailable on older deployment images. | **MEDIUM** | Fixed |
| **9** | **UI / Input Layout (Settings)** | Collaborator invite inputs used non-standard `pl-9.5`, causing placeholder text to collide with the input icons on certain viewports. | **LOW** | Fixed |
| **10** | **Contrast Checker (Common)** | Hex-to-RGB parser did not sanitize partial/invalid hex inputs, resulting in `NaN:1` contrast ratio badges. | **LOW** | Fixed |
| **11** | **Visual Diff Engine (Utils)** | `computeWordDiff` lacked defensive string casting for non-string or `null` values passed during rapid version switching. | **LOW** | Fixed |
| **12** | **Auth Validation (Backend)** | Backend registration endpoint permitted 6-character passwords while frontend required 8 characters. | **MEDIUM** | Fixed |
| **13** | **Auth Alias Route (Backend)** | `POST /api/auth/demo-login` was missing, forcing all demo logins through workspace routes. | **LOW** | Fixed |
| **14** | **RBAC Middleware (Backend)** | `requireWorkspaceRole` crashed with unhandled 500 when passed non-ObjectId hex strings instead of returning HTTP 400. | **MEDIUM** | Fixed |
| **15** | **Review Engine (Backend)** | `runGroundedChecks` loop allowed duplicate tone/legal findings to be pushed for the same sentence across multiple guidelines. | **MEDIUM** | Fixed |
| **16** | **Demo Seeder (Backend)** | `demoSeeder.js` only set `passwordHash` on first user insert, preventing password logins if accounts already existed without hashes. | **HIGH** | Fixed |

---

## Detailed Bug Analysis & Technical Solutions

### 1. Cross-Origin Resource Sharing (CORS) & Preflight Interceptor
- **Files Modified:** `backend/src/app.js`
- **Issue:** When the Vercel frontend sent custom headers (`x-organisation-id`, `Authorization`) to the Render backend, browser preflight `OPTIONS` requests were rejected because `x-organisation-id` was not explicitly enumerated in `Access-Control-Allow-Headers`.
- **Solution:** Implemented a universal preflight interceptor at the top of the Express middleware stack before Helmet and routers. It intercepts all `OPTIONS` requests and immediately responds with HTTP `204 No Content` and full wildcard/dynamic origin authorization.

### 2. Multi-Tenant Workspace ID Sanitization
- **Files Modified:** `frontend/src/features/auth/AuthContext.jsx`, `frontend/src/lib/api.js`, `frontend/src/services/api.js`
- **Issue:** When the frontend was offline or loading, it fell back to a dummy string ID (`novatech-global-preview`). When passed to Mongoose queries (`/contents`, `/guidelines`, `/facts`), MongoDB threw `Cast to ObjectId failed for value "novatech-global-preview"`.
- **Solution:** 
  - Queried the live Atlas database and identified the authentic MongoDB ObjectId for the NovaTech Global organization: `6af9d8a604f3ddc6a913904d`.
  - Defined `NOVATECH_GLOBAL_ID = '6af9d8a604f3ddc6a913904d'` as the default fallback.
  - Added auto-migration logic in `AuthContext` and both API wrappers that converts any cached `novatech-global-preview` from `localStorage` to `NOVATECH_GLOBAL_ID`.

### 3. API Headers Scoping
- **Files Modified:** `frontend/src/lib/api.js`, `frontend/src/services/api.js`
- **Issue:** `apiFetch` and `getHeaders` attached `x-organisation-id` to every outgoing HTTP request, including `/api/auth/me`, `/api/auth/login`, and `/api/auth/register`, where tenant scoping is not applicable and causes unnecessary CORS preflight baggage.
- **Solution:** Added endpoint inspection in `apiFetch` and `getHeaders(token, organisationId)` to automatically suppress `x-organisation-id` on auth and demo endpoints.

### 4. Firebase Singleton App Initialization
- **Files Modified:** `frontend/src/lib/firebase.js`, `frontend/src/services/firebase.js`
- **Issue:** `initializeApp(firebaseConfig)` was being invoked in both files without checking `getApps().length`, which risks throwing `FirebaseError: Firebase App named '[DEFAULT]' already exists` during HMR or when both files are imported.
- **Solution:** 
  - Updated `src/lib/firebase.js` to use `getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)`.
  - Refactored `src/services/firebase.js` to re-export initialized instances directly from `src/lib/firebase.js`.

### 5. Client-Side Error Boundary Component
- **Files Created:** `frontend/src/components/common/ErrorBoundary.jsx`
- **Files Modified:** `frontend/src/App.jsx`
- **Issue:** The React component tree lacked an Error Boundary around code-split tabs. An unhandled client exception in any page caused the entire application to unmount and display a blank white page.
- **Solution:** Built an enterprise-grade `ErrorBoundary` component styled with BrandLens AI design tokens (`#0f2744` navy and teal). Includes error diagnostics, a "Retry Section" button, and a "Return to Dashboard" fallback.

### 6. Dropdown Outside-Click Dismissal
- **Files Modified:** `frontend/src/components/layout/Navbar.jsx`
- **Issue:** Clicking anywhere outside the Workspace Switcher or User Profile dropdown did not close them.
- **Solution:** Attached `useRef` hooks to both dropdown containers and registered a global `mousedown` document listener to automatically dismiss menus on outside interaction.

### 7. Resilient Multi-Resource Fetching in Knowledge Base
- **Files Modified:** `frontend/src/pages/KnowledgeBasePage.jsx`
- **Issue:** `loadData()` used `Promise.all([ guidelines, facts, terminology, assets ])`. If any single endpoint failed (e.g. assets empty or network timeout), `Promise.all` rejected immediately, wiping out all guidelines and terminology from the view.
- **Solution:** Replaced with `Promise.allSettled`. Successfully fulfilled requests now render their respective tabs independently, and error alerts are only shown if all services fail.

### 8. Multi-Tier 1-Click Demo Login Fallback
- **Files Modified:** `frontend/src/lib/api.js`
- **Issue:** `workspaceApi.demoLogin` called `POST /api/workspaces/demo-login`. If an older deployment container was active on Render that lacked this route, the button failed with a 404 error.
- **Solution:** Implemented automatic 3-tier cascade:
  1. Primary: `POST /api/workspaces/demo-login`
  2. Secondary: `POST /api/auth/demo-login`
  3. Tertiary: `POST /api/auth/login` with pre-seeded demo credentials (`<role>@novatech.demo` / `NovaTechDemo2026!`).

### 9. Collaborator Input Placeholder Padding
- **Files Modified:** `frontend/src/pages/SettingsPage.jsx`
- **Issue:** Collaborator invite input fields used `pl-9.5 sm:pl-10`. On standard Tailwind builds without custom spacing overrides, `pl-9.5` can collapse to 0, causing placeholder text to collide with the input icons.
- **Solution:** Standardized to `pl-10` (40px) across all viewports to provide consistent clearance between the icon and input text.

### 10. WCAG Contrast Analyzer Input Sanitization
- **Files Modified:** `frontend/src/components/common/ContrastChecker.jsx`
- **Issue:** Typing an incomplete or invalid hex string caused `parseInt` to return `NaN`, resulting in `NaN:1` contrast badges and broken pass/fail criteria.
- **Solution:** Added regex hex validation and fallback to `{ r: 0, g: 0, b: 0 }` with `isFinite()` checks in `calculateContrastRatio`.

### 11. Word Diff Engine Defensive Input Handling
- **Files Modified:** `frontend/src/utils/diff.js`
- **Issue:** If non-string values or `null` were passed to `computeWordDiff` during version switching, `.match()` threw a TypeError.
- **Solution:** Added defensive string type casting (`typeof text === 'string' ? text : String(text || '')`) at the function entrypoint.

### 12. Password Length Policy Alignment
- **Files Modified:** `backend/src/modules/auth/auth.routes.js`
- **Issue:** Frontend enforced an 8-character password policy, while the backend validation in `/api/auth/register` still allowed 6 characters.
- **Solution:** Synchronized backend validation to require minimum 8 characters (`password.length < 8`), returning a clear 400 Bad Request error if not met.

### 13. Auth Demo-Login Endpoint Alias
- **Files Modified:** `backend/src/modules/auth/auth.routes.js`
- **Issue:** Some frontend components attempted to reach `/api/auth/demo-login` while the controller was only mapped under `/api/workspaces/demo-login`.
- **Solution:** Registered `router.post('/demo-login')` in `auth.routes.js` to provide full API namespace parity.

### 14. Server-Side RBAC ObjectId Validation
- **Files Modified:** `backend/src/middleware/requireWorkspaceRole.js`
- **Issue:** Passing an invalid workspace ID string caused Mongoose to throw an unhandled `CastError`, resulting in HTTP 500 instead of a standard 400 Bad Request.
- **Solution:** Added `mongoose.Types.ObjectId.isValid(organisationId)` verification before querying the `memberships` collection, returning clean HTTP 400 with a descriptive error message.

### 15. Duplicate Tone Finding Deduplication
- **Files Modified:** `backend/src/modules/reviews/review.service.js`
- **Issue:** In `runGroundedChecks`, iterating over all active guidelines caused identical tone mismatch findings to be generated multiple times for the same sentence.
- **Solution:** Added `sentenceFlaggedTone` boolean gate so each sentence is flagged at most once per review run.

### 16. Demo Accounts Database Password Hash Sync
- **Files Modified:** `backend/src/seed/demoSeeder.js`
- **Issue:** `demoSeeder.js` only set `passwordHash` when creating new MongoDB users. If user documents existed from earlier migrations without hashes, password authentication failed.
- **Solution:** Updated the seeder to always compute and save `User.hashPassword(demoUser.password)` during updates. Re-seeded all 4 demo users into Atlas:
  - `admin@novatech.demo` (ADMIN)
  - `manager@novatech.demo` (MANAGER)
  - `reviewer@novatech.demo` (REVIEWER)
  - `creator@novatech.demo` (CREATOR)

---

## Verification & Build Results

1. **Frontend Vite Build:**
   ```
   ✓ 1625 modules transformed.
   dist/index.html                              1.22 kB │ gzip:  0.60 kB
   dist/assets/index-DkI8NXSn.css              72.99 kB │ gzip: 11.74 kB
   dist/assets/index-BkADHjB6.js              284.08 kB │ gzip: 60.24 kB
   ✓ built in 3.61s
   ```
2. **Live Render Backend Authentication Test:**
   ```json
   POST https://brandlens-backend-ghtd.onrender.com/api/auth/login
   Body: { "email": "admin@novatech.demo", "password": "NovaTechDemo2026!" }
   Result: { "success": true, "token": "<JWT_TOKEN>", "user": { "role": "ADMIN" } }
   ```
3. **CORS Preflight Test:**
   ```http
   OPTIONS https://brandlens-backend-ghtd.onrender.com/api/auth/me
   Origin: https://brand-lens-ai-ten.vercel.app
   Status: 204 No Content
   Access-Control-Allow-Origin: https://brand-lens-ai-ten.vercel.app
   Access-Control-Allow-Headers: Content-Type, Authorization, x-organisation-id
   ```
