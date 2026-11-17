# BrandLens AI — Firebase Auth & Multi-Tenant Workspace Setup Guide (Round 3)

This guide covers the complete setup and end-to-end workflow for adding **Firebase Authentication** (Email/Password, Google Sign-In, and 1-Click Demo Role login for judges) alongside **multi-user, multi-tenant workspaces** in **MongoDB Atlas** + **Node.js/Express** + **React**.

---

## 1. Architecture Overview

Firebase handles **identity only** (sign-in, sign-up, Google OAuth, and ID tokens). **MongoDB Atlas** remains the source of truth for organisations, memberships, server-side RBAC, brand knowledge, submissions, versions, and audit logs.

```text
React Frontend (Vercel)
  │
  ├── 1. User signs in via Firebase Auth (Google / Email / Demo Role)
  ├── 2. Firebase returns ID Token (JWT)
  ├── 3. Frontend sends:
  │      Authorization: Bearer <firebase_id_token>
  │      x-organisation-id: <active_workspace_id>
  │
  ▼
Node.js + Express API (Render)
  │
  ├── 4. verifyFirebaseToken middleware (firebase-admin)
  │      - Verifies token signature & expiry
  │      - Upserts user in MongoDB `users` by `firebaseUid`
  │      - Auto-activates any `INVITED` memberships matching `email`
  │
  ├── 5. requireWorkspaceRole(['ADMIN', 'MANAGER', ...]) middleware
  │      - Queries MongoDB `memberships` for (organisationId, userId)
  │      - Blocks unauthorised actions with 403 Forbidden
  │
  ▼
MongoDB Atlas
  ├── users          (firebaseUid, name, email)
  ├── organisations  (name, slug, settings)
  └── memberships    (organisationId, userId, invitedEmail, role, status)
```

---

## 2. Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create or select your project (`brandlens-ai`).
2. **Enable Sign-In Providers:**
   - Open **Authentication → Sign-in method**.
   - Enable **Email/Password**.
   - Enable **Google** (add your support email).
3. **Add Authorized Domains:**
   - Go to **Authentication → Settings → Authorized domains**.
   - Add `localhost` and `brand-lens-ai-ten.vercel.app` (plus your custom domain if any).
4. **Get Frontend Web Config:**
   - Go to **Project Settings → General → Your apps → Web app (`</>`)** and copy `apiKey`, `authDomain`, `projectId`, and `appId`.
5. **Generate Backend Service Account:**
   - Go to **Project Settings → Service accounts → Generate new private key**.
   - Store `project_id`, `client_email`, and `private_key` in your backend `.env` (never commit the JSON key to GitHub).

---

## 3. Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
FRONTEND_ORIGIN=https://brand-lens-ai-ten.vercel.app
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 4. MongoDB Data Model Updates

### `users`
```js
{
  _id: ObjectId,
  firebaseUid: String, // unique index
  name: String,
  email: String,       // unique lowercase index
  avatarUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

### `organisations`
```js
{
  _id: ObjectId,
  name: String,        // e.g., "NovaTech Global"
  slug: String,        // unique, e.g., "novatech-global"
  createdBy: ObjectId, // ref: users
  createdAt: Date,
  updatedAt: Date
}
```

### `memberships`
```js
{
  _id: ObjectId,
  organisationId: ObjectId, // ref: organisations
  userId: ObjectId | null,  // null while status === 'INVITED'
  invitedEmail: String,     // lowercase email for pending invites
  role: 'ADMIN' | 'MANAGER' | 'REVIEWER' | 'CREATOR',
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED',
  createdAt: Date,
  updatedAt: Date
}
```
**Recommended Indexes:**
- `users`: `{ firebaseUid: 1 }` (unique, sparse), `{ email: 1 }` (unique)
- `organisations`: `{ slug: 1 }` (unique)
- `memberships`: `{ organisationId: 1, invitedEmail: 1 }` (unique, sparse), `{ organisationId: 1, userId: 1 }` (unique, sparse)

---

## 5. Backend Implementation (Node.js + Express)

Install the Admin SDK in `backend/`:
```bash
npm install firebase-admin
```

### 5.1 Initialize `firebaseAdmin.js`
```js
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default admin;
```

### 5.2 `verifyFirebaseToken.js` Middleware
```js
import admin from '../config/firebaseAdmin.js';
import User from '../models/User.js';
import Membership from '../models/Membership.js';

export async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization Bearer token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = (decoded.email || '').toLowerCase();

    // 1. Upsert user in MongoDB
    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        email,
        name: decoded.name || email.split('@')[0] || 'User',
        avatarUrl: decoded.picture || '',
      });
    }

    // 2. Auto-activate any pending workspace invites for this email
    if (email) {
      await Membership.updateMany(
        { invitedEmail: email, status: 'INVITED' },
        { $set: { userId: user._id, status: 'ACTIVE' } }
      );
    }

    req.user = user;
    req.firebaseUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired Firebase token' });
  }
}
```

### 5.3 `requireWorkspaceRole.js` Middleware (Server-Side RBAC)
```js
import Membership from '../models/Membership.js';

export function requireWorkspaceRole(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      const organisationId = req.headers['x-organisation-id'] || req.params.organisationId;
      if (!organisationId) {
        return res.status(400).json({ error: 'Missing x-organisation-id header' });
      }

      const membership = await Membership.findOne({
        organisationId,
        userId: req.user._id,
        status: 'ACTIVE',
      });

      if (!membership) {
        return res.status(403).json({ error: 'Not an active member of this workspace' });
      }

      if (allowedRoles.length && !allowedRoles.includes(membership.role)) {
        return res.status(403).json({
          error: `Role ${membership.role} is not permitted for this action`,
        });
      }

      req.organisationId = organisationId;
      req.membership = membership;
      next();
    } catch (err) {
      return res.status(500).json({ error: 'Workspace authorisation failed' });
    }
  };
}
```

### 5.4 Workspace & Invite Routes (`workspaces.routes.js`)
- `GET /api/workspaces` (protected by `verifyFirebaseToken`):
  Returns all `ACTIVE` memberships for `req.user._id` populated with `organisationId`.
- `POST /api/workspaces` (protected by `verifyFirebaseToken`):
  Creates a new `Organisation` (`name`, unique `slug`) and creates an `ACTIVE` `ADMIN` membership for `req.user._id`.
- `POST /api/workspaces/:organisationId/invite` (protected by `verifyFirebaseToken` + `requireWorkspaceRole(['ADMIN'])`):
  Accepts `{ email, role }`. If a `User` with `email` already exists, creates an `ACTIVE` membership immediately; otherwise creates an `INVITED` membership with `invitedEmail: email.toLowerCase()`, `userId: null`.
- `PATCH /api/workspaces/:organisationId/members/:memberId` (protected by `requireWorkspaceRole(['ADMIN'])`):
  Updates a member's `role` or `status`.

### 5.5 1-Click Demo Role Login for Judges
Create 4 seeded demo users in Firebase Auth + MongoDB for the `NovaTech Global` workspace:
- `admin@novatech.demo` (`ADMIN`)
- `manager@novatech.demo` (`MANAGER`)
- `reviewer@novatech.demo` (`REVIEWER`)
- `creator@novatech.demo` (`CREATOR`)

---

## 6. Frontend Implementation (React)

### 6.1 `src/lib/firebase.js`
Exports initialized `auth`, `googleProvider`, etc.

### 6.2 `src/lib/api.js`
Attaches `Authorization: Bearer <idToken>` and `x-organisation-id` to requests.

### 6.3 `src/pages/AuthPage.jsx`
Split-screen UI matching BrandLens AI's `#0f2744` navy + teal palette, with Sign In / Create Account tabs, Continue with Google, inline error handling, and 1-Click Judge Demo Role buttons.

### 6.4 `src/components/CreateWorkspaceModal.jsx`
Modal for users with 0 workspaces.
