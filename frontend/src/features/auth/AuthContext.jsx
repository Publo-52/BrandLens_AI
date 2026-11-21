import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  auth,
  signInWithGoogle as fbSignInWithGoogle,
  signInWithEmail as fbSignInWithEmail,
  signUpWithEmail as fbSignUpWithEmail,
  logOut as fbLogOut,
  onAuthStateChanged,
} from '../../lib/firebase';
import { workspaceApi } from '../../lib/api';
import { api } from '../../services/api';

const AuthContext = createContext(null);

function extractOrgId(org) {
  if (!org) return null;
  if (typeof org === 'string') return org;
  const id = org._id || org.id || org.organisationId?._id || org.organisationId;
  return id ? String(id) : null;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('brandlens_logged_out') === 'true') {
      return null;
    }
    return typeof window !== 'undefined' ? localStorage.getItem('brandlens_token') : null;
  });
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('brandlens_logged_out') === 'true') {
      return null;
    }
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('brandlens_user') : null;
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [memberships, setMemberships] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('brandlens_active_org_id') : null;
  });
  const [loading, setLoading] = useState(true);

  const persistOrg = useCallback((id) => {
    const stringId = id ? String(id) : null;
    setActiveOrgId(stringId);
    if (stringId) {
      localStorage.setItem('brandlens_active_org_id', stringId);
    } else {
      localStorage.removeItem('brandlens_active_org_id');
    }
  }, []);

  // Sync workspaces from backend with multi-tiered fallback
  const fetchWorkspacesAndSync = useCallback(
    async (authToken) => {
      const effectiveToken = authToken || localStorage.getItem('brandlens_token');
      if (effectiveToken) {
        try {
          const meData = await api.getMe(effectiveToken);
          if (meData?.user) {
            localStorage.setItem('brandlens_user', JSON.stringify(meData.user));
            setUser(meData.user);
          }
        } catch (meErr) {
          // Keep existing user profile if /api/auth/me is temporarily unavailable
        }
      }

      let wsList = [];
      try {
        // 1. Try modern /api/workspaces
        const data = await workspaceApi.getWorkspaces();
        wsList = data.workspaces || data.organisations || [];
      } catch (err) {
        console.warn('GET /api/workspaces error, trying /api/organisations fallback:', err.message);
        // 2. Try legacy /api/organisations
        try {
          const legacyData = await api.getOrganisations(authToken || localStorage.getItem('brandlens_token'));
          wsList = legacyData.organisations || [];
        } catch (legacyErr) {
          console.warn('GET /api/organisations fallback also failed:', legacyErr.message);
        }
      }

      setWorkspaces(wsList);
      setMemberships(wsList);

      const savedOrgId = localStorage.getItem('brandlens_active_org_id');
      const validOrg = wsList.find((w) => extractOrgId(w) === String(savedOrgId));

      if (validOrg) {
        setActiveOrgId(extractOrgId(validOrg));
      } else if (wsList.length > 0) {
        const firstId = extractOrgId(wsList[0]);
        persistOrg(firstId);
      } else {
        persistOrg(null);
      }
      return wsList;
    },
    [persistOrg]
  );

  // Load user profile & sync with backend session
  const refreshSession = useCallback(async () => {
    if (typeof window !== 'undefined' && localStorage.getItem('brandlens_logged_out') === 'true') {
      setLoading(false);
      return;
    }
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('brandlens_token') : null;
    if (!currentToken) {
      setLoading(false);
      return;
    }

    try {
      const syncPromise = (async () => {
        // 1. Validate session token against backend /api/auth/me
        const meData = await api.getMe(currentToken);
        if (meData?.user) {
          setUser(meData.user);
          localStorage.setItem('brandlens_user', JSON.stringify(meData.user));
        }

        // 2. Fetch active workspaces
        await fetchWorkspacesAndSync(currentToken);
      })();

      // Strict 3-second fallback: if backend cold start is slow, unblock loading
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000));
      await Promise.race([syncPromise, timeoutPromise]);
    } catch (err) {
      console.warn('Session refresh error:', err?.message || err);
      // If token is invalid/expired (401/403), clear stale session rather than showing broken state
      if (err?.status === 401 || err?.status === 403) {
        localStorage.removeItem('brandlens_token');
        localStorage.removeItem('brandlens_user');
        localStorage.removeItem('brandlens_active_org_id');
        setToken(null);
        setUser(null);
        setWorkspaces([]);
        setMemberships([]);
        setActiveOrgId(null);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchWorkspacesAndSync]);

  // Fallback safety timeout: ensure loading ALWAYS resolves to false within 3 seconds
  // so visitors or users on slow cold-start backends are never blocked indefinitely
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(safetyTimer);
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      // If user has explicitly logged out, ensure we NEVER restore session or token
      if (typeof window !== 'undefined' && localStorage.getItem('brandlens_logged_out') === 'true') {
        if (fbUser) {
          try {
            await fbLogOut();
          } catch (e) {}
        }
        setFirebaseUser(null);
        setUser(null);
        setToken(null);
        setWorkspaces([]);
        setMemberships([]);
        setLoading(false);
        return;
      }

      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('brandlens_token', idToken);
          setToken(idToken);
          const userObj = {
            _id: fbUser.uid,
            firebaseUid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            avatarUrl: fbUser.photoURL || '',
          };
          localStorage.setItem('brandlens_user', JSON.stringify(userObj));
          setUser(userObj);

          // Sync with backend /api/workspaces (auto-activates pending invites!) with 3-second safety race
          const syncPromise = fetchWorkspacesAndSync(idToken);
          const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000));
          await Promise.race([syncPromise, timeoutPromise]);
        } catch (tokenErr) {
          console.error('Error fetching Firebase token:', tokenErr);
        } finally {
          setLoading(false);
        }
      } else {
        setFirebaseUser(null);
        const savedToken = typeof window !== 'undefined' ? localStorage.getItem('brandlens_token') : null;
        if (!savedToken) {
          setUser(null);
          setWorkspaces([]);
          setMemberships([]);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchWorkspacesAndSync]);

  // Initial check on mount: restore existing session, never auto-relogin after explicit Sign Out
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('brandlens_logged_out') === 'true') {
      setLoading(false);
      return;
    }
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('brandlens_token') : null;
    if (savedToken) {
      refreshSession();
    } else {
      setLoading(false);
    }
  }, [refreshSession]);

  // ── Authentication Actions ────────────────────────────────────────────────
  const loginWithFirebase = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        localStorage.removeItem('brandlens_logged_out');
        const fbUser = await fbSignInWithEmail(email, password);
        const idToken = await fbUser.getIdToken();
        localStorage.setItem('brandlens_token', idToken);
        setToken(idToken);
        const userObj = {
          _id: fbUser.uid,
          firebaseUid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || fbUser.email.split('@')[0],
          avatarUrl: fbUser.photoURL || '',
        };
        localStorage.setItem('brandlens_user', JSON.stringify(userObj));
        setUser(userObj);
        await fetchWorkspacesAndSync(idToken);
        return fbUser;
      } finally {
        setLoading(false);
      }
    },
    [fetchWorkspacesAndSync]
  );

  const signUpWithFirebase = useCallback(
    async ({ email, password, displayName, workspaceName }) => {
      setLoading(true);
      try {
        localStorage.removeItem('brandlens_logged_out');
        const fbUser = await fbSignUpWithEmail(email, password, displayName);
        const idToken = await fbUser.getIdToken();
        localStorage.setItem('brandlens_token', idToken);
        setToken(idToken);
        const userObj = {
          _id: fbUser.uid,
          firebaseUid: fbUser.uid,
          email: fbUser.email,
          name: displayName || fbUser.email.split('@')[0],
          avatarUrl: '',
        };
        localStorage.setItem('brandlens_user', JSON.stringify(userObj));
        setUser(userObj);

        // 1. Initial sync (picks up any existing invites for this email)
        const existingWs = await fetchWorkspacesAndSync(idToken);

        // 2. If no workspace exists yet or workspaceName specified, create default workspace
        if (workspaceName || existingWs.length === 0) {
          try {
            const orgName = workspaceName || `${displayName || 'Personal'}'s Workspace`;
            const created = await workspaceApi.createWorkspace({ name: orgName });
            const createdOrgId = created.workspace?._id || created.organisation?._id;
            if (createdOrgId) {
              persistOrg(extractOrgId(createdOrgId));
              await fetchWorkspacesAndSync(idToken);
            }
          } catch (createErr) {
            console.warn('Initial workspace creation error:', createErr);
          }
        }
        return fbUser;
      } finally {
        setLoading(false);
      }
    },
    [fetchWorkspacesAndSync, persistOrg]
  );

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      localStorage.removeItem('brandlens_logged_out');
      const fbUser = await fbSignInWithGoogle();
      const idToken = await fbUser.getIdToken();
      localStorage.setItem('brandlens_token', idToken);
      setToken(idToken);
      const userObj = {
        _id: fbUser.uid,
        firebaseUid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email.split('@')[0],
        avatarUrl: fbUser.photoURL || '',
      };
      localStorage.setItem('brandlens_user', JSON.stringify(userObj));
      setUser(userObj);

      // Sync with backend (auto-activates pending invites matching google email!)
      const wsList = await fetchWorkspacesAndSync(idToken);

      // If user has 0 workspaces after invite activation, create personal one
      if (wsList.length === 0) {
        try {
          const orgName = `${fbUser.displayName || 'Personal'}'s Workspace`;
          const created = await workspaceApi.createWorkspace({ name: orgName });
          const createdOrgId = created.workspace?._id || created.organisation?._id;
          if (createdOrgId) {
            persistOrg(extractOrgId(createdOrgId));
            await fetchWorkspacesAndSync(idToken);
          }
        } catch (createErr) {
          console.warn('Initial workspace creation error:', createErr);
        }
      }
      return fbUser;
    } finally {
      setLoading(false);
    }
  }, [fetchWorkspacesAndSync, persistOrg]);

  // Unified login: tries Firebase Auth first, falls back to legacy/database login
  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        localStorage.removeItem('brandlens_logged_out');
        try {
          const fbUser = await fbSignInWithEmail(email, password);
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('brandlens_token', idToken);
          setToken(idToken);
          const userObj = {
            _id: fbUser.uid,
            firebaseUid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email.split('@')[0],
            avatarUrl: fbUser.photoURL || '',
          };
          localStorage.setItem('brandlens_user', JSON.stringify(userObj));
          setUser(userObj);
          await fetchWorkspacesAndSync(idToken);
          return { success: true, user: fbUser, token: idToken };
        } catch (fbErr) {
          if (
            fbErr.code === 'auth/user-not-found' ||
            fbErr.code === 'auth/invalid-credential' ||
            fbErr.code === 'auth/wrong-password' ||
            fbErr.code === 'auth/invalid-email'
          ) {
            const data = await api.login({ email, password });
            localStorage.setItem('brandlens_token', data.token);
            setToken(data.token);
            setUser(data.user);
            if (data.user) {
              localStorage.setItem('brandlens_user', JSON.stringify(data.user));
            }
            await fetchWorkspacesAndSync(data.token);
            return data;
          }
          throw fbErr;
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchWorkspacesAndSync]
  );

  // Unified register: creates Firebase Auth account and workspace
  const register = useCallback(
    async ({ name, email, password, organisationName }) => {
      setLoading(true);
      try {
        localStorage.removeItem('brandlens_logged_out');
        try {
          const fbUser = await fbSignUpWithEmail(email, password, name);
          const idToken = await fbUser.getIdToken();
          localStorage.setItem('brandlens_token', idToken);
          setToken(idToken);
          const userObj = {
            _id: fbUser.uid,
            firebaseUid: fbUser.uid,
            email: fbUser.email,
            name: name || fbUser.email.split('@')[0],
            avatarUrl: '',
          };
          localStorage.setItem('brandlens_user', JSON.stringify(userObj));
          setUser(userObj);

          const orgName = organisationName || `${name || 'Personal'}'s Workspace`;
          const created = await workspaceApi.createWorkspace({ name: orgName });
          const createdOrgId = created.workspace?._id || created.organisation?._id;
          if (createdOrgId) {
            persistOrg(extractOrgId(createdOrgId));
          }
          await fetchWorkspacesAndSync(idToken);
          return { success: true, user: fbUser, workspace: created.workspace };
        } catch (fbErr) {
          if (fbErr.code === 'auth/email-already-in-use') {
            throw new Error('This email is already registered. Please sign in instead.');
          }
          if (fbErr.code === 'auth/weak-password') {
            throw new Error('Password must be at least 8 characters long.');
          }
          const data = await api.register({ name, email, password, organisationName });
          localStorage.setItem('brandlens_token', data.token);
          setToken(data.token);
          setUser(data.user);
          if (data.user) {
            localStorage.setItem('brandlens_user', JSON.stringify(data.user));
          }
          if (data.organisation?._id) {
            persistOrg(extractOrgId(data.organisation._id));
          }
          await fetchWorkspacesAndSync(data.token);
          return data;
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchWorkspacesAndSync, persistOrg]
  );

  const logout = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('brandlens_logged_out', 'true');
        localStorage.removeItem('brandlens_token');
        localStorage.removeItem('brandlens_user');
        localStorage.removeItem('brandlens_active_org_id');
      }
      await fbLogOut();
    } catch (e) {
      console.warn('Logout notice:', e?.message || e);
    } finally {
      setToken(null);
      setFirebaseUser(null);
      setUser(null);
      setMemberships([]);
      setWorkspaces([]);
      setActiveOrgId(null);
      setLoading(false);
    }
  }, []);

  const switchOrg = useCallback(
    (orgId) => {
      const id = extractOrgId(orgId);
      if (id) {
        persistOrg(id);
      }
    },
    [persistOrg]
  );

  // ── Derived active workspace & role ───────────────────────────────────────
  const activeWorkspace = useMemo(() => {
    const stringActiveId = activeOrgId ? String(activeOrgId) : null;
    return (
      workspaces.find((w) => extractOrgId(w) === stringActiveId) ||
      workspaces[0] ||
      null
    );
  }, [workspaces, activeOrgId]);

  const activeRole = useMemo(() => {
    return activeWorkspace?.role || user?.role || 'CREATOR';
  }, [activeWorkspace, user]);

  const contextValue = useMemo(
    () => ({
      token,
      user,
      firebaseUser,
      memberships: workspaces,
      workspaces,
      activeOrg: activeWorkspace,
      activeWorkspace,
      activeOrgId,
      activeRole,
      loading,
      loginWithFirebase,
      signUpWithFirebase,
      loginWithGoogle,
      login,
      register,
      logout,
      switchOrg,
      switchOrganisation: switchOrg,
      refreshSession,
    }),
    [
      token,
      user,
      firebaseUser,
      workspaces,
      activeWorkspace,
      activeOrgId,
      activeRole,
      loading,
      loginWithFirebase,
      signUpWithFirebase,
      loginWithGoogle,
      login,
      register,
      logout,
      switchOrg,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
