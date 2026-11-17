import { auth } from './firebase.js';

const getDevApiBase = () => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
};

export const API_BASE_URL = (
  import.meta.env.DEV
    ? (import.meta.env.VITE_DEV_API_URL || getDevApiBase())
    : (import.meta.env.VITE_API_BASE_URL || 'https://brandlens-backend-ghtd.onrender.com')
).replace(/\/+$/, '');

/**
 * Enhanced fetch wrapper that automatically attaches Firebase Bearer ID tokens
 * and the active x-organisation-id header.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // 1. Content-Type default
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // 2. Attach Bearer ID token (from Firebase currentUser or localStorage fallback)
  if (!headers.has('Authorization')) {
    let token = null;
    if (auth.currentUser) {
      try {
        token = await auth.currentUser.getIdToken();
      } catch (e) {
        console.warn('Failed to retrieve Firebase ID token:', e.message);
      }
    }
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('brandlens_token');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // 3. Attach active x-organisation-id header
  if (!headers.has('x-organisation-id') && !headers.has('X-Organisation-Id')) {
    const orgId =
      options.organisationId ||
      (typeof window !== 'undefined' ? localStorage.getItem('brandlens_active_org_id') : null);
    if (orgId) {
      headers.set('x-organisation-id', orgId);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : await response.text();

  if (!response.ok) {
    const errorMessage =
      data?.error?.message ||
      data?.error ||
      data?.message ||
      `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.statusCode = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ── Workspaces & RBAC API Helpers (Dual Endpoint: /api/workspaces + /api/organisations fallback)
export const workspaceApi = {
  // List all workspaces for the authenticated user
  async getWorkspaces() {
    try {
      return await apiFetch('/api/workspaces');
    } catch (err) {
      return await apiFetch('/api/organisations');
    }
  },

  // Create a new workspace (creator automatically assigned ADMIN role)
  async createWorkspace({ name, settings = {} }) {
    try {
      return await apiFetch('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name, settings }),
      });
    } catch (err) {
      return await apiFetch('/api/organisations', {
        method: 'POST',
        body: JSON.stringify({ name, settings }),
      });
    }
  },

  // Invite collaborator by email and role (ADMIN only)
  async inviteCollaborator(organisationId, { email, role = 'CREATOR' }) {
    try {
      return await apiFetch(`/api/workspaces/${organisationId}/invite`, {
        method: 'POST',
        organisationId,
        body: JSON.stringify({ email, role }),
      });
    } catch (err) {
      return await apiFetch(`/api/organisations/${organisationId}/members`, {
        method: 'POST',
        organisationId,
        body: JSON.stringify({ email, role }),
      });
    }
  },

  // Update member role or status (ADMIN only)
  async updateMember(organisationId, memberId, { role, status }) {
    try {
      return await apiFetch(`/api/workspaces/${organisationId}/members/${memberId}`, {
        method: 'PATCH',
        organisationId,
        body: JSON.stringify({ role, status }),
      });
    } catch (err) {
      return await apiFetch(`/api/organisations/${organisationId}/members/${memberId}`, {
        method: 'PATCH',
        organisationId,
        body: JSON.stringify({ role, status }),
      });
    }
  },

  // List members of a workspace
  async getMembers(organisationId) {
    try {
      return await apiFetch(`/api/workspaces/${organisationId}/members`, {
        organisationId,
      });
    } catch (err) {
      return await apiFetch(`/api/organisations/${organisationId}/members`, {
        organisationId,
      });
    }
  },

  // 1-Click Demo Login for Hackathon Judges
  async demoLogin(role = 'ADMIN') {
    return await apiFetch('/api/workspaces/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },
};

export default apiFetch;
