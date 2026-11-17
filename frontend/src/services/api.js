// Dynamically resolve API base URL:
// 1. If VITE_API_BASE_URL is specified, use it (e.g. from .env or .env.production).
// 2. In local dev, dynamically connect to the current host's IP/domain on port 5000.
//    (Enables seamless sign-in and testing from other devices on the LAN, e.g. mobile or tablet).
// 3. In production, default to the live Render backend: https://brandlens-backend-ghtd.onrender.com.
const getDevApiBase = () => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
};

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? getDevApiBase() : 'https://brandlens-backend-ghtd.onrender.com')
).replace(/\/+$/, '');

function getHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// In-flight request deduplicator to eliminate redundant concurrent API calls
const inFlightRequests = new Map();

async function request(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  if (!isGet) {
    inFlightRequests.clear(); // Bust cache on mutations
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error?.message || `Request failed (${res.status})`);
    return data;
  }

  const cacheKey = `${url}:${options.headers?.Authorization || ''}`;
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error?.message || `Request failed (${res.status})`);
      return data;
    } finally {
      setTimeout(() => inFlightRequests.delete(cacheKey), 2500); // 2.5s deduplication window
    }
  })();

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

export const api = {
  // System Health
  async getBackendHealth() {
    try {
      return await request(`${API_BASE}/api/health`);
    } catch (error) {
      return { status: 'unreachable', service: 'backend', error: error.message };
    }
  },

  async getAIServiceHealth() {
    try {
      return await request(`${API_BASE}/api/health/ai`);
    } catch (error) {
      return { success: false, aiServiceStatus: 'unreachable', error: error.message };
    }
  },

  // Auth
  async register({ name, email, password, organisationName }) {
    return await request(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password, organisationName }),
    });
  },

  async login({ email, password }) {
    return await request(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
  },

  async googleLogin({ name, email, firebaseUid, photoURL }) {
    try {
      return await request(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, email, firebaseUid, photoURL }),
      });
    } catch (err) {
      // Fallback: if backend /api/auth/google returns 404 before redeploy finishes,
      // authenticate seamlessly via the standard login/register routes
      if (err.message?.includes('404') || err.message?.includes('Cannot POST') || err.message?.includes('failed (404)')) {
        const synthPassword = `GAuth_${(firebaseUid || 'User').slice(0, 16)}!`;
        try {
          return await this.login({ email, password: synthPassword });
        } catch {
          return await this.register({
            name: name || email.split('@')[0],
            email,
            password: synthPassword,
            organisationName: `${name || 'Personal'}'s Workspace`,
          });
        }
      }
      throw err;
    }
  },

  async getMe(token) {
    return await request(`${API_BASE}/api/auth/me`, {
      headers: getHeaders(token),
    });
  },

  // Organisations
  async getOrganisations(token) {
    return await request(`${API_BASE}/api/organisations`, {
      headers: getHeaders(token),
    });
  },

  async updateOrganisation(orgId, updateData, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(updateData),
    });
  },

  // Members & RBAC
  async getMembers(orgId, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/members`, {
      headers: getHeaders(token),
    });
  },

  async inviteMember(orgId, { email, role, name }, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/members`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ email, role, name }),
    });
  },

  async updateMemberRole(orgId, memberId, role, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/members/${memberId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ role }),
    });
  },

  // Guidelines
  async getGuidelines(orgId, token, category) {
    const url = new URL(`${API_BASE}/api/organisations/${orgId}/guidelines`);
    if (category) url.searchParams.append('category', category);
    return await request(url.toString(), { headers: getHeaders(token) });
  },

  async createGuideline(orgId, guidelineData, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/guidelines`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(guidelineData),
    });
  },

  // Approved Facts
  async getFacts(orgId, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/facts`, {
      headers: getHeaders(token),
    });
  },

  async createFact(orgId, factData, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/facts`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(factData),
    });
  },

  // Terminology
  async getTerminology(orgId, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/terminology`, {
      headers: getHeaders(token),
    });
  },

  async createTerminology(orgId, ruleData, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/terminology`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(ruleData),
    });
  },

  // Brand Assets
  async getAssets(orgId, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/assets`, {
      headers: getHeaders(token),
    });
  },

  async createAsset(orgId, assetData, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/assets`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(assetData),
    });
  },

  // Seed Demo Brand Pack (NovaTech)
  async seedDemoKnowledge(orgId, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/knowledge/seed-demo`, {
      method: 'POST',
      headers: getHeaders(token),
    });
  },
  async seedDemoBrandPack(orgId, token) {
    return this.seedDemoKnowledge(orgId, token);
  },

  // Content Intake & Review
  async getContents(orgId, token, filters = {}) {
    const url = new URL(`${API_BASE}/api/organisations/${orgId}/contents`);
    if (filters.status) url.searchParams.append('status', filters.status);
    if (filters.channel) url.searchParams.append('channel', filters.channel);
    return await request(url.toString(), { headers: getHeaders(token) });
  },

  async getContent(orgId, contentId, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/contents/${contentId}`, {
      headers: getHeaders(token),
    });
  },

  async createContent(orgId, { title, channel, audience, text, files, altTexts }, token) {
    inFlightRequests.clear();
    const formData = new FormData();
    formData.append('title', title);
    if (channel) formData.append('channel', channel);
    if (audience) formData.append('audience', audience);
    if (text) formData.append('text', text);
    if (altTexts) {
      formData.append('altTexts', typeof altTexts === 'string' ? altTexts : JSON.stringify(altTexts));
    }

    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });
    }

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/organisations/${orgId}/contents`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error?.message || 'Failed to submit draft content');
    return data;
  },

  async createContentVersion(orgId, contentId, { text, changeSummary }, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/contents/${contentId}/versions`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ text, changeSummary }),
    });
  },

  async submitNewVersion(orgId, contentId, data, token) {
    return this.createContentVersion(orgId, contentId, data, token);
  },

  async updateFindingDecision(orgId, contentId, findingId, decisionData, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/contents/${contentId}/findings/${findingId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(decisionData),
    });
  },

  // Approvals & Workflow
  async requestApproval(orgId, contentId, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/contents/${contentId}/approval-request`, {
      method: 'POST',
      headers: getHeaders(token),
    });
  },

  async submitApprovalDecision(orgId, contentId, { decision, reason }, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/contents/${contentId}/decision`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ decision, reason }),
    });
  },

  async publishContent(orgId, contentId, { destination, liveUrl }, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/contents/${contentId}/publish`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ destination, liveUrl }),
    });
  },

  // Comments
  async getComments(orgId, contentId, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/contents/${contentId}/comments`, {
      headers: getHeaders(token),
    });
  },

  async addComment(orgId, contentId, { body, findingId }, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/contents/${contentId}/comments`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ body, findingId }),
    });
  },

  // Governance Insights & Audit Logs
  async getInsights(orgId, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/insights`, {
      headers: getHeaders(token),
    });
  },

  async getAuditLogs(orgId, token) {
    return await request(`${API_BASE}/api/organisations/${orgId}/audit-logs`, {
      headers: getHeaders(token),
    });
  },
};
