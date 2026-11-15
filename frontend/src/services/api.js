const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function getHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // System Health
  async getBackendHealth() {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (error) {
      return { status: 'unreachable', service: 'backend', error: error.message };
    }
  },

  async getAIServiceHealth() {
    try {
      const response = await fetch(`${API_BASE}/api/health/ai`);
      return await response.json();
    } catch (error) {
      return { success: false, aiServiceStatus: 'unreachable', error: error.message };
    }
  },

  // Auth
  async register({ name, email, password, organisationName }) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password, organisationName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Registration failed');
    return data;
  },

  async login({ email, password }) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Login failed');
    return data;
  },

  async getMe(token) {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch user session');
    return data;
  },

  // Organisations
  async getOrganisations(token) {
    const res = await fetch(`${API_BASE}/api/organisations`, {
      headers: getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to list organisations');
    return data;
  },

  async updateOrganisation(orgId, updateData, token) {
    const res = await fetch(`${API_BASE}/api/organisations/${orgId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(updateData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to update organisation');
    return data;
  },

  // Members & RBAC
  async getMembers(orgId, token) {
    const res = await fetch(`${API_BASE}/api/organisations/${orgId}/members`, {
      headers: getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to list members');
    return data;
  },

  async inviteMember(orgId, { email, role, name }, token) {
    const res = await fetch(`${API_BASE}/api/organisations/${orgId}/members`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ email, role, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to invite member');
    return data;
  },

  async updateMemberRole(orgId, memberId, role, token) {
    const res = await fetch(`${API_BASE}/api/organisations/${orgId}/members/${memberId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to update member role');
    return data;
  },

  // Guidelines
  async getGuidelines(orgId, token, category) {
    const url = new URL(`${API_BASE}/api/organisations/${orgId}/guidelines`);
    if (category) url.searchParams.append('category', category);
    const res = await fetch(url.toString(), { headers: getHeaders(token) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to list guidelines');
    return data;
  },

  async createGuideline(orgId, guidelineData, token) {
    const res = await fetch(`${API_BASE}/api/organisations/${orgId}/guidelines`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(guidelineData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to create guideline');
    return data;
  },

  // Approved Facts
  async getFacts(orgId, token) {
    const res = await fetch(`${API_BASE}/api/organisations/${orgId}/facts`, {
      headers: getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to list facts');
    return data;
  },

  async createFact(orgId, factData, token) {
    const res = await fetch(`${API_BASE}/api/organisations/${orgId}/facts`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(factData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to create fact');
    return data;
  },

  // Terminology
  async getTerminology(orgId, token) {
    const res = await fetch(`${API_BASE}/api/organisations/${orgId}/terminology`, {
      headers: getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to list terminology');
    return data;
  },

  async createTerminology(orgId, ruleData, token) {
    const res = await fetch(`${API_BASE}/api/organisations/${orgId}/terminology`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(ruleData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to create terminology rule');
    return data;
  },

  // Brand Assets
  async getAssets(orgId, token) {
    const res = await fetch(`${API_BASE}/api/organisations/${orgId}/assets`, {
      headers: getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to list assets');
    return data;
  },

  async createAsset(orgId, assetData, token) {
    const res = await fetch(`${API_BASE}/api/organisations/${orgId}/assets`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(assetData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to create asset');
    return data;
  },

  // Demo Seeder
  async seedDemoBrandPack(orgId, token) {
    const res = await fetch(`${API_BASE}/api/organisations/${orgId}/knowledge/seed-demo`, {
      method: 'POST',
      headers: getHeaders(token),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to seed demo brand pack');
    return data;
  },
};
