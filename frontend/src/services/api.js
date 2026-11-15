const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const api = {
  async getBackendHealth() {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return {
        status: 'unreachable',
        service: 'backend',
        error: error.message,
      };
    }
  },

  async getAIServiceHealth() {
    try {
      const response = await fetch(`${API_BASE}/api/health/ai`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        aiServiceStatus: 'unreachable',
        error: error.message,
      };
    }
  },
};
