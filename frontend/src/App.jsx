import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Layout } from './components/layout/Layout';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Code-split pages for instant initial load and optimal browser caching
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ReviewPage = lazy(() => import('./pages/ReviewPage').then((m) => ({ default: m.ReviewPage })));
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage').then((m) => ({ default: m.KnowledgeBasePage })));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage').then((m) => ({ default: m.ApprovalsPage })));
const InsightsPage = lazy(() => import('./pages/InsightsPage').then((m) => ({ default: m.InsightsPage })));
const AuditPage = lazy(() => import('./pages/AuditPage').then((m) => ({ default: m.AuditPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
      <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
      <span className="text-xs text-slate-400 font-medium tracking-wide">Loading BrandLens AI...</span>
    </div>
  );
}

function MainApp() {
  const { user, token, loading, loginWithDemoRole } = useAuth();
  const [routeState, setRouteState] = useState(resolveRouteFromUrl);

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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        <span className="text-xs text-teal-300 font-medium tracking-wider uppercase">
          Loading BrandLens AI...
        </span>
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

  const renderContent = () => {
    switch (routeState.tab) {
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
        return <DashboardPage onNavigate={setCurrentTab} />;
    }
  };

  return (
    <Layout currentTab={routeState.tab} onSelectTab={setCurrentTab}>
      <ErrorBoundary onGoHome={() => setCurrentTab('dashboard')}>
        <Suspense fallback={<PageLoadingFallback />}>
          {renderContent()}
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
