import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Layout } from './components/layout/Layout';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Resilient lazy loader: recovers automatically once if a stale hashed chunk 404s after a new deployment
function lazyWithRetry(importer) {
  return lazy(async () => {
    const reloadFlag = 'brandlens_chunk_reloaded';
    try {
      const mod = await importer();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(reloadFlag);
      }
      return mod;
    } catch (err) {
      const msg = String(err?.message || err || '');
      const isChunkError =
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Importing a module script failed') ||
        msg.includes('Loading chunk') ||
        err?.name === 'ChunkLoadError';

      if (isChunkError && typeof window !== 'undefined' && !sessionStorage.getItem(reloadFlag)) {
        sessionStorage.setItem(reloadFlag, '1');
        window.location.reload();
        return new Promise(() => {});
      }
      throw err;
    }
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    const reloadFlag = 'brandlens_chunk_reloaded';
    if (!sessionStorage.getItem(reloadFlag)) {
      sessionStorage.setItem(reloadFlag, '1');
      window.location.reload();
    }
  });
}

// Code-split pages for instant initial load and optimal browser caching
const LandingPage = lazyWithRetry(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const AuthPage = lazyWithRetry(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ReviewPage = lazyWithRetry(() => import('./pages/ReviewPage').then((m) => ({ default: m.ReviewPage })));
const KnowledgeBasePage = lazyWithRetry(() => import('./pages/KnowledgeBasePage').then((m) => ({ default: m.KnowledgeBasePage })));
const ApprovalsPage = lazyWithRetry(() => import('./pages/ApprovalsPage').then((m) => ({ default: m.ApprovalsPage })));
const InsightsPage = lazyWithRetry(() => import('./pages/InsightsPage').then((m) => ({ default: m.InsightsPage })));
const AuditPage = lazyWithRetry(() => import('./pages/AuditPage').then((m) => ({ default: m.AuditPage })));
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const VALID_TABS = new Set(['dashboard', 'review', 'knowledge', 'approvals', 'insights', 'audit', 'settings']);

function resolveRouteFromUrl() {
  if (typeof window === 'undefined') {
    return { view: 'landing', authMode: 'signin', tab: 'dashboard' };
  }

  const isExplicitlyLoggedOut = localStorage.getItem('brandlens_logged_out') === 'true';
  const hasToken = !isExplicitlyLoggedOut && !!localStorage.getItem('brandlens_token');
  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '').trim();

  // If user is unauthenticated or explicitly logged out, clear leftover workspace hash
  if (!hasToken && VALID_TABS.has(hash)) {
    window.location.hash = '';
  }

  // 1. Explicit Login / Signup routes or hashes
  if (
    pathname === '/login' ||
    pathname === '/signin' ||
    pathname === '/signup' ||
    pathname === '/register' ||
    hash === 'login' ||
    hash === 'signin' ||
    hash === 'signup' ||
    hash === 'register'
  ) {
    const isSignup =
      pathname === '/signup' ||
      pathname === '/register' ||
      hash === 'signup' ||
      hash === 'register' ||
      search.includes('mode=signup') ||
      search.includes('mode=register');
    return { view: 'login', authMode: isSignup ? 'signup' : 'signin', tab: 'dashboard' };
  }

  // 2. Explicit App / Workspace routes or valid tab hashes
  if (
    pathname.startsWith('/app') ||
    pathname.startsWith('/dashboard') ||
    VALID_TABS.has(hash)
  ) {
    // If not authenticated or logged out, block workspace route and send to login or landing
    if (!hasToken) {
      if (pathname.startsWith('/app') || pathname.startsWith('/dashboard')) {
        return { view: 'login', authMode: 'signin', tab: 'dashboard' };
      }
      return { view: 'landing', authMode: 'signin', tab: 'dashboard' };
    }
    const tab = VALID_TABS.has(hash) ? hash : 'dashboard';
    return { view: 'app', authMode: 'signin', tab };
  }

  // 3. Root path '/' or default
  return { view: 'landing', authMode: 'signin', tab: 'dashboard' };
}

function PageLoadingFallback() {
  return (
    <div
      style={{ background: '#fafafc' }}
      className="flex flex-col items-center justify-center min-h-[60vh] space-y-4"
    >
      <style>{`
        @keyframes orbFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(30px,-40px) scale(1.07); }
        }
        @keyframes orbFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-40px,30px) scale(1.09); }
        }
      `}</style>
      {/* Drifting orbs */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', width: 260, height: 260, borderRadius: '50%',
          background: 'rgba(167,139,250,0.22)', filter: 'blur(60px)',
          top: '20%', left: '15%', animation: 'orbFloat1 9s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(56,189,248,0.18)', filter: 'blur(50px)',
          top: '50%', right: '20%', animation: 'orbFloat2 11s ease-in-out infinite',
        }} />
      </div>
      {/* Logo + spinner */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <img
          src="/favicon-48x48.png"
          alt="BrandLens AI Logo"
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            margin: '0 auto 16px',
            display: 'block',
            boxShadow: '0 8px 24px rgba(99,102,241,0.25)',
          }}
        />
        <Loader2 style={{ color: '#6366f1', margin: '0 auto 12px', display: 'block' }} className="w-6 h-6 animate-spin" />
        <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500, letterSpacing: '0.06em' }}>
          Loading BrandLens AI…
        </span>
      </div>
    </div>
  );
}

// Lightweight inline card & list skeleton for instant tab transitions inside Layout (never flashes full-page spinner)
function WorkspaceTabSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading tab view">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200/80 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-slate-100 rounded-lg" />
          <div className="h-9 w-32 bg-slate-200/80 rounded-lg" />
        </div>
      </div>

      {/* 4 KPI / Status Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-100 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
            </div>
            <div className="h-7 w-16 bg-slate-200/80 rounded" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main Body Skeleton */}
      <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="h-5 w-40 bg-slate-200/80 rounded" />
          <div className="h-8 w-24 bg-slate-100 rounded-lg" />
        </div>
        <div className="space-y-3 pt-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-1/3 bg-slate-200/70 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const { user, token, loading, loginWithDemoRole, activeOrg } = useAuth();
  const [routeState, setRouteState] = useState(resolveRouteFromUrl);
  // Track visited workspace tabs for keep-alive preservation with instant switching
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([routeState.tab]));

  // Reset visited tabs cache if active organization changes
  useEffect(() => {
    setVisitedTabs(new Set([routeState.tab]));
  }, [activeOrg?._id]);

  // Keep track of any new tab visited in the current session
  useEffect(() => {
    if (routeState.view === 'app' && VALID_TABS.has(routeState.tab)) {
      setVisitedTabs((prev) => {
        if (prev.has(routeState.tab)) return prev;
        const next = new Set(prev);
        next.add(routeState.tab);
        return next;
      });
    }
  }, [routeState.view, routeState.tab]);

  // Eagerly preload all workspace tab chunks in idle time for zero-delay switches
  useEffect(() => {
    if (user && token) {
      const preloadTabChunks = () => {
        import('./pages/DashboardPage');
        import('./pages/ReviewPage');
        import('./pages/KnowledgeBasePage');
        import('./pages/ApprovalsPage');
        import('./pages/InsightsPage');
        import('./pages/AuditPage');
        import('./pages/SettingsPage');
      };
      if (typeof window !== 'undefined') {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(preloadTabChunks);
        } else {
          setTimeout(preloadTabChunks, 150);
        }
      }
    }
  }, [user, token]);

  const navigateTo = (destination, extra = {}) => {
    let newView = 'landing';
    let newAuthMode = extra.mode || 'signin';
    let newTab = extra.tab || routeState.tab || 'dashboard';

    if (destination === 'landing' || destination === '/') {
      newView = 'landing';
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', '/');
      }
    } else if (destination === 'login' || destination === 'signin') {
      newView = 'login';
      newAuthMode = 'signin';
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', '/login');
      }
    } else if (destination === 'signup' || destination === 'register') {
      newView = 'login';
      newAuthMode = 'signup';
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', '/login?mode=signup');
      }
    } else if (destination === 'app' || destination === 'dashboard') {
      newView = 'app';
      const safeTab = VALID_TABS.has(newTab) ? newTab : 'dashboard';
      newTab = safeTab;
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', `/app#${safeTab}`);
      }
    }

    setRouteState({ view: newView, authMode: newAuthMode, tab: newTab });
  };

  const setCurrentTab = (tab) => {
    const safeTab = VALID_TABS.has(tab) ? tab : 'dashboard';
    setRouteState((prev) => ({ ...prev, view: 'app', tab: safeTab }));
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/app#${safeTab}`);
    }
  };

  // Listen for browser Back/Forward (popstate) and hash changes
  useEffect(() => {
    const onNavigationChange = () => {
      const resolved = resolveRouteFromUrl();
      setRouteState(resolved);
    };

    window.addEventListener('popstate', onNavigationChange);
    window.addEventListener('hashchange', onNavigationChange);
    return () => {
      window.removeEventListener('popstate', onNavigationChange);
      window.removeEventListener('hashchange', onNavigationChange);
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{ background: '#fafafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
      >
        <style>{`
          @keyframes orbFloat1 {
            0%   { transform: translate(0px, 0px) scale(1); }
            50%  { transform: translate(30px, -40px) scale(1.07); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          @keyframes orbFloat2 {
            0%   { transform: translate(0px, 0px) scale(1); }
            50%  { transform: translate(-40px, 30px) scale(1.09); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          @keyframes orbFloat3 {
            0%   { transform: translate(0px, 0px) scale(1); }
            50%  { transform: translate(20px, 40px) scale(1.05); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          @keyframes dotPulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
            40%            { opacity: 1;   transform: scale(1.4); }
          }
        `}</style>
        {/* Animated orbs */}
        <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'rgba(167,139,250,0.26)', filter: 'blur(90px)', top: '-80px', left: '-80px', animation: 'orbFloat1 10s ease-in-out infinite', zIndex: 0 }} />
        <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'rgba(56,189,248,0.22)', filter: 'blur(80px)', bottom: '5%', right: '-60px', animation: 'orbFloat2 13s ease-in-out infinite', zIndex: 0 }} />
        <div style={{ position: 'absolute', width: 240, height: 240, borderRadius: '50%', background: 'rgba(244,114,182,0.16)', filter: 'blur(70px)', bottom: '30%', left: '10%', animation: 'orbFloat3 15s ease-in-out infinite', zIndex: 0 }} />

        {/* Card */}
        <div style={{
          position: 'relative', zIndex: 1, textAlign: 'center',
          background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(15,23,42,0.08)', borderRadius: 24,
          padding: '48px 56px', boxShadow: '0 8px 40px rgba(99,102,241,0.10)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        }}>
          {/* Full Brand Logo */}
          <div style={{ textAlign: 'center' }}>
            <img
              src="/brandlens-full-logo.png"
              alt="BrandLens AI Logo"
              style={{
                height: 44,
                width: 'auto',
                objectFit: 'contain',
                margin: '0 auto',
                display: 'block',
              }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              v1.0 &bull; Pre-Publication Governance
            </div>
          </div>

          {/* Spinner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
            <Loader2 style={{ color: '#6366f1', animation: 'spin 1s linear infinite', width: 20, height: 20 }} className="animate-spin" />
            Preparing your workspace…
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%', background: '#6366f1',
                opacity: 0.3,
                animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 32, color: '#94a3b8', fontSize: 12 }}>
          Team ALGO_X • Global Institute of Science and Technology
        </div>
      </div>
    );
  }

  // 1. Landing Page View (Root Route '/')
  if (routeState.view === 'landing') {
    return (
      <ErrorBoundary onGoHome={() => navigateTo('landing')}>
        <Suspense fallback={<PageLoadingFallback />}>
          <LandingPage
            onNavigate={navigateTo}
            onDemoLogin={async (role) => {
              if (loginWithDemoRole) {
                await loginWithDemoRole(role);
              }
              navigateTo('app', { tab: 'dashboard' });
            }}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 2. Authentication View ('/login', '/signup')
  if (routeState.view === 'login') {
    // If already authenticated and navigating to login, jump straight to workspace
    if (user && token) {
      navigateTo('app', { tab: 'dashboard' });
      return null;
    }

    return (
      <ErrorBoundary onGoHome={() => navigateTo('landing')}>
        <Suspense fallback={<PageLoadingFallback />}>
          <AuthPage
            initialMode={routeState.authMode}
            onAuthSuccess={() => navigateTo('app', { tab: 'dashboard' })}
            onBackToHome={() => navigateTo('landing')}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 3. Protected Workspace View ('/app', '#dashboard', etc.)
  // If unauthenticated user lands on workspace URL, prompt AuthPage with link back to Landing
  if (!user || !token) {
    return (
      <ErrorBoundary onGoHome={() => navigateTo('landing')}>
        <Suspense fallback={<PageLoadingFallback />}>
          <AuthPage
            initialMode="signin"
            onAuthSuccess={() => navigateTo('app', { tab: 'dashboard' })}
            onBackToHome={() => navigateTo('landing')}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  const renderTab = (tabKey) => {
    switch (tabKey) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentTab} />;
      case 'review':
        return <ReviewPage />;
      case 'knowledge':
        return <KnowledgeBasePage />;
      case 'approvals':
        return <ApprovalsPage />;
      case 'insights':
        return <InsightsPage />;
      case 'audit':
        return <AuditPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <Layout currentTab={routeState.tab} onSelectTab={setCurrentTab}>
      <ErrorBoundary onGoHome={() => setCurrentTab('dashboard')}>
        <Suspense fallback={<WorkspaceTabSkeleton />}>
          {Array.from(VALID_TABS).map((tabKey) => {
            if (!visitedTabs.has(tabKey)) return null;
            const isCurrent = routeState.tab === tabKey;
            return (
              <div
                key={tabKey}
                id={`tab-panel-${tabKey}`}
                role="tabpanel"
                aria-hidden={!isCurrent}
                className={isCurrent ? 'block' : 'hidden'}
                style={{ display: isCurrent ? 'block' : 'none' }}
              >
                {renderTab(tabKey)}
              </div>
            );
          })}
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
