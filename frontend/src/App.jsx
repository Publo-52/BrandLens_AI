import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Layout } from './components/layout/Layout';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Code-split pages for instant initial load and optimal browser caching
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ReviewPage = lazy(() => import('./pages/ReviewPage').then((m) => ({ default: m.ReviewPage })));
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage').then((m) => ({ default: m.KnowledgeBasePage })));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage').then((m) => ({ default: m.ApprovalsPage })));
const InsightsPage = lazy(() => import('./pages/InsightsPage').then((m) => ({ default: m.InsightsPage })));
const AuditPage = lazy(() => import('./pages/AuditPage').then((m) => ({ default: m.AuditPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const VALID_TABS = new Set(['dashboard', 'review', 'knowledge', 'approvals', 'insights', 'audit', 'settings']);

function getInitialTab() {
  if (typeof window === 'undefined') return 'dashboard';
  const hashTab = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
  return VALID_TABS.has(hashTab) ? hashTab : 'dashboard';
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
  const { user, token, loading } = useAuth();
  const [currentTab, setCurrentTabState] = useState(getInitialTab);

  const setCurrentTab = (tab) => {
    const safeTab = VALID_TABS.has(tab) ? tab : 'dashboard';
    setCurrentTabState(safeTab);
    if (typeof window !== 'undefined' && window.location.hash !== `#${safeTab}`) {
      window.history.replaceState(null, '', `#${safeTab}`);
    }
  };

  useEffect(() => {
    const onHashChange = () => {
      const hashTab = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
      if (VALID_TABS.has(hashTab)) {
        setCurrentTabState(hashTab);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
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

  // Protected routes: require an authenticated session before accessing workspace pages
  if (!user || !token) {
    return (
      <ErrorBoundary onGoHome={() => setCurrentTab('dashboard')}>
        <Suspense fallback={<PageLoadingFallback />}>
          <AuthPage onAuthSuccess={() => setCurrentTab('dashboard')} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
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
    <Layout currentTab={currentTab} onSelectTab={setCurrentTab}>
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
