import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth as firebaseAuth } from '../../services/firebase';
import { api } from '../../services/api';

const AuthContext = createContext(null);

function extractOrgId(org) {
  return typeof org === 'object' ? org?._id : org;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('brandlens_token'));
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState(() => localStorage.getItem('brandlens_active_org_id'));
  const [loading, setLoading] = useState(true);

  const persistOrg = useCallback((id) => {
    setActiveOrgId(id);
    if (id) localStorage.setItem('brandlens_active_org_id', id);
  }, []);

  const initAuth = useCallback(async () => {
    let savedToken = localStorage.getItem('brandlens_token');

    // Auto-login to pre-seeded NovaTech Admin demo workspace if no session exists yet
    if (!savedToken) {
      try {
        const loginData = await api.login({
          email: 'admin@novatech.com',
          password: 'DemoPass123!',
        });
        if (loginData?.token) {
          savedToken = loginData.token;
          localStorage.setItem('brandlens_token', loginData.token);
          setToken(loginData.token);
          setUser(loginData.user);
          setMemberships(loginData.memberships || []);
          const firstOrgId = extractOrgId(loginData.memberships?.[0]?.organisationId);
          if (firstOrgId) persistOrg(firstOrgId);
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

      const savedOrgId = localStorage.getItem('brandlens_active_org_id');
      const validOrg = data.memberships?.find(
        (m) => extractOrgId(m.organisationId) === savedOrgId
      );

      if (validOrg) {
        setActiveOrgId(savedOrgId);
      } else if (data.memberships?.length > 0) {
        persistOrg(extractOrgId(data.memberships[0].organisationId));
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
  }, [persistOrg]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('brandlens_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setMemberships(data.memberships || []);
    if (data.memberships?.length > 0) {
      persistOrg(extractOrgId(data.memberships[0].organisationId));
    }
    return data;
  }, [persistOrg]);

  const register = useCallback(async ({ name, email, password, organisationName }) => {
    const data = await api.register({ name, email, password, organisationName });
    localStorage.setItem('brandlens_token', data.token);
    setToken(data.token);
    setUser(data.user);
    const initialMembership = { ...data.membership, organisationId: data.organisation };
    setMemberships([initialMembership]);
    const newOrgId = data.organisation?._id;
    setActiveOrgId(newOrgId);
    if (newOrgId) localStorage.setItem('brandlens_active_org_id', newOrgId);
    return data;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(firebaseAuth, provider);
    const fbUser = result.user;

    const data = await api.googleLogin({
      email: fbUser.email,
      name: fbUser.displayName || fbUser.email.split('@')[0],
      firebaseUid: fbUser.uid,
      photoURL: fbUser.photoURL,
    });

    localStorage.setItem('brandlens_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setMemberships(data.memberships || []);
    if (data.memberships?.length > 0) {
      persistOrg(extractOrgId(data.memberships[0].organisationId));
    }
    return data;
  }, [persistOrg]);

  const logout = useCallback(() => {
    localStorage.removeItem('brandlens_token');
    localStorage.removeItem('brandlens_active_org_id');
    setToken(null);
    setUser(null);
    setMemberships([]);
    setActiveOrgId(null);
  }, []);

  const switchOrg = useCallback((orgId) => {
    const exists = memberships.find((m) => extractOrgId(m.organisationId) === orgId);
    if (exists) persistOrg(orgId);
  }, [memberships, persistOrg]);

  // Memoize derived values to avoid re-renders in consumers
  const activeMembership = useMemo(
    () =>
      memberships.find((m) => extractOrgId(m.organisationId) === activeOrgId) ||
      memberships[0] ||
      null,
    [memberships, activeOrgId]
  );

  const activeOrg = useMemo(
    () =>
      activeMembership && typeof activeMembership.organisationId === 'object'
        ? activeMembership.organisationId
        : null,
    [activeMembership]
  );

  const activeRole = activeMembership?.role || 'CREATOR';

  const contextValue = useMemo(
    () => ({
      token,
      user,
      memberships,
      activeOrg,
      activeOrgId,
      activeRole,
      loading,
      login,
      loginWithGoogle,
      register,
      logout,
      switchOrg,
      refreshSession: initAuth,
    }),
    [token, user, memberships, activeOrg, activeOrgId, activeRole, loading, login, loginWithGoogle, register, logout, switchOrg, initAuth]
  );

  return (
    <AuthContext.Provider value={contextValue}>
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
