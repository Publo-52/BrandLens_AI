import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('brandlens_token'));
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState(() => localStorage.getItem('brandlens_active_org_id'));
  const [loading, setLoading] = useState(true);

  const initAuth = useCallback(async () => {
    let savedToken = localStorage.getItem('brandlens_token');

    // Auto-login to pre-seeded NovaTech Admin demo workspace if no session exists yet
    if (!savedToken) {
      try {
        const loginData = await api.login({
          email: 'admin@novatech.demo',
          password: 'DemoPass123!',
        });
        if (loginData?.token) {
          savedToken = loginData.token;
          localStorage.setItem('brandlens_token', loginData.token);
          setToken(loginData.token);
          setUser(loginData.user);
          setMemberships(loginData.memberships || []);

          const firstOrg = loginData.memberships?.[0]?.organisationId;
          const firstOrgId = typeof firstOrg === 'object' ? firstOrg?._id : firstOrg;
          if (firstOrgId) {
            setActiveOrgId(firstOrgId);
            localStorage.setItem('brandlens_active_org_id', firstOrgId);
          }
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Initial demo auto-login skipped:', e.message);
      }
    }

    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe(savedToken);
      setUser(data.user);
      setMemberships(data.memberships || []);

      // Determine active organisation
      const savedOrgId = localStorage.getItem('brandlens_active_org_id');
      const validOrg = data.memberships?.find((m) => {
        const id = typeof m.organisationId === 'object' ? m.organisationId?._id : m.organisationId;
        return id === savedOrgId;
      });

      if (validOrg) {
        setActiveOrgId(savedOrgId);
      } else if (data.memberships && data.memberships.length > 0) {
        const firstOrg = data.memberships[0].organisationId;
        const firstOrgId = typeof firstOrg === 'object' ? firstOrg?._id : firstOrg;
        setActiveOrgId(firstOrgId);
        if (firstOrgId) {
          localStorage.setItem('brandlens_active_org_id', firstOrgId);
        }
      }
    } catch (err) {
      console.warn('Session expired or invalid:', err.message);
      localStorage.removeItem('brandlens_token');
      localStorage.removeItem('brandlens_active_org_id');
      setToken(null);
      setUser(null);
      setMemberships([]);
      setActiveOrgId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('brandlens_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setMemberships(data.memberships || []);

    if (data.memberships && data.memberships.length > 0) {
      const firstOrg = data.memberships[0].organisationId;
      const firstOrgId = typeof firstOrg === 'object' ? firstOrg?._id : firstOrg;
      setActiveOrgId(firstOrgId);
      if (firstOrgId) {
        localStorage.setItem('brandlens_active_org_id', firstOrgId);
      }
    }
    return data;
  };

  const register = async ({ name, email, password, organisationName }) => {
    const data = await api.register({ name, email, password, organisationName });
    localStorage.setItem('brandlens_token', data.token);
    setToken(data.token);
    setUser(data.user);

    const initialMembership = {
      ...data.membership,
      organisationId: data.organisation,
    };
    setMemberships([initialMembership]);
    const newOrgId = data.organisation?._id;
    setActiveOrgId(newOrgId);
    if (newOrgId) {
      localStorage.setItem('brandlens_active_org_id', newOrgId);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('brandlens_token');
    localStorage.removeItem('brandlens_active_org_id');
    setToken(null);
    setUser(null);
    setMemberships([]);
    setActiveOrgId(null);
  };

  const switchOrg = (orgId) => {
    const exists = memberships.find((m) => {
      const id = typeof m.organisationId === 'object' ? m.organisationId?._id : m.organisationId;
      return id === orgId;
    });
    if (exists) {
      setActiveOrgId(orgId);
      localStorage.setItem('brandlens_active_org_id', orgId);
    }
  };

  const activeMembership =
    memberships.find((m) => {
      const id = typeof m.organisationId === 'object' ? m.organisationId?._id : m.organisationId;
      return id === activeOrgId;
    }) || memberships[0] || null;

  const activeOrg =
    activeMembership && typeof activeMembership.organisationId === 'object'
      ? activeMembership.organisationId
      : null;
  const activeRole = activeMembership?.role || 'CREATOR';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        memberships,
        activeOrg,
        activeOrgId,
        activeRole,
        loading,
        login,
        register,
        logout,
        switchOrg,
        refreshSession: initAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
