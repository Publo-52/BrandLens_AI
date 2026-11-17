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
  const [token, setToken] = useState(() => localStorage.getItem('brandlens_token'));
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('brandlens_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [memberships, setMemberships] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState(() => localStorage.getItem('brandlens_active_org_id'));
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

      // 3. Ensure a valid NovaTech Global workspace preview is always available so the UI never crashes
      if (!wsList || wsList.length === 0) {
        wsList = [
          {
            _id: 'novatech-global-preview',
            name: 'NovaTech Global',
            slug: 'novatech-global',
            role: 'ADMIN',
          },
        ];
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
      }
      return wsList;
    },
    [persistOrg]
  );

  // Load user profile & sync with backend session
  const refreshSession = useCallback(async () => {
    const currentToken = localStorage.getItem('brandlens_token');
    if (!currentToken) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch user profile from /api/auth/me or fallback
      try {
        const meData = await api.getMe(currentToken);
        if (meData?.user) {
          setUser(meData.user);
          localStorage.setItem('brandlens_user', JSON.stringify(meData.user));
        }
      } catch (meErr) {
        // Fallback for demo tokens or direct firebase tokens
      }

      // 2. Fetch active workspaces
      await fetchWorkspacesAndSync(currentToken);
    } catch (err) {
      console.warn('Session refresh error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchWorkspacesAndSync]);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
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

          // Sync with backend /api/workspaces (auto-activates pending invites!)
          await fetchWorkspacesAndSync(idToken);
        } catch (tokenErr) {
          console.error('Error fetching Firebase token:', tokenErr);
        }
      } else {
        setFirebaseUser(null);
        // Only clear if not using a demo token
        const savedToken = localStorage.getItem('brandlens_token');
        if (savedToken && !savedToken.startsWith('demo:') && !token) {
          setUser(null);
          localStorage.removeItem('brandlens_user');
          setWorkspaces([]);
          setMemberships([]);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchWorkspacesAndSync, token]);

  // Initial check on mount: If no session, auto-connect to NovaTech Global so visitor can surf immediately
  useEffect(() => {
    const savedToken = localStorage.getItem('brandlens_token');
    if (savedToken) {
      refreshSession();
    } else {
      (async () => {
        try {
          const demoData = await workspaceApi.demoLogin('ADMIN');
          if (demoData?.token) {
            localStorage.setItem('brandlens_token', demoData.token);
            setToken(demoData.token);
            if (demoData.user) {
              localStorage.setItem('brandlens_user', JSON.stringify(demoData.user));
              setUser(demoData.user);
            }
            if (demoData.workspace?._id) {
              persistOrg(demoData.workspace._id);
            }
            await fetchWorkspacesAndSync(demoData.token);
          }
        } catch (e) {
          console.warn('Initial demo preview auto-load skipped, providing offline preview:', e.message);
          // Set in-memory demo preview so visitors are never blocked
          const previewOrg = {
            _id: 'novatech-global-preview',
            name: 'NovaTech Global',
            slug: 'novatech-global',
            role: 'ADMIN',
          };
          setWorkspaces([previewOrg]);
          setMemberships([previewOrg]);
          persistOrg(previewOrg._id);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [refreshSession, fetchWorkspacesAndSync, persistOrg]);

  // ── Authentication Actions ────────────────────────────────────────────────
  const loginWithFirebase = useCallback(
    async (email, password) => {
      setLoading(true);
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

  // 1-Click Judge Demo Role Login
  const loginWithDemoRole = useCallback(
    async (role = 'ADMIN') => {
      setLoading(true);
      const normalizedRole = role.toUpperCase();
      try {
        let tokenToUse = null;
        let userToUse = null;
        let wsToUse = null;

        try {
          const data = await workspaceApi.demoLogin(normalizedRole);
          if (data.token) {
            tokenToUse = data.token;
            userToUse = data.user;
            wsToUse = data.workspace;
          }
        } catch (demoErr) {
          console.warn('Remote demoLogin fallback:', demoErr.message);
          tokenToUse = `demo:${normalizedRole.toLowerCase()}@novatech.demo`;
          userToUse = {
            _id: `demo_${normalizedRole.toLowerCase()}`,
            name: `NovaTech ${normalizedRole.charAt(0) + normalizedRole.slice(1).toLowerCase()}`,
            email: `${normalizedRole.toLowerCase()}@novatech.demo`,
            role: normalizedRole,
          };
          wsToUse = {
            _id: 'novatech-global-preview',
            name: 'NovaTech Global',
            slug: 'novatech-global',
            role: normalizedRole,
          };
        }

        if (tokenToUse) {
          localStorage.setItem('brandlens_token', tokenToUse);
          setToken(tokenToUse);
          if (userToUse) {
            localStorage.setItem('brandlens_user', JSON.stringify(userToUse));
            setUser(userToUse);
          }
          if (wsToUse?._id) {
            persistOrg(extractOrgId(wsToUse));
          }
          await fetchWorkspacesAndSync(tokenToUse);
        }
        return { token: tokenToUse, user: userToUse, workspace: wsToUse };
      } finally {
        setLoading(false);
      }
    },
    [fetchWorkspacesAndSync, persistOrg]
  );

  // Unified login: tries Firebase Auth first, falls back to legacy/demo API login
  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
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
      await fbLogOut();
    } catch (e) {}
    localStorage.removeItem('brandlens_token');
    localStorage.removeItem('brandlens_user');
    localStorage.removeItem('brandlens_active_org_id');
    setToken(null);
    setFirebaseUser(null);
    setUser(null);
    setMemberships([]);
    setWorkspaces([]);
    setActiveOrgId(null);
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
      loginWithDemoRole,
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
      loginWithDemoRole,
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
