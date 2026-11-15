import React, { useState, lazy, Suspense } from 'react';
import { Layout } from './components/layout/Layout';
import { AuthProvider } from './features/auth/AuthContext';
import { Loader2 } from 'lucide-react';

// Code-split pages for instant initial load and optimal browser caching
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ReviewPage = lazy(() => import('./pages/ReviewPage').then((m) => ({ default: m.ReviewPage })));
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage').then((m) => ({ default: m.KnowledgeBasePage })));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage').then((m) => ({ default: m.ApprovalsPage })));
const InsightsPage = lazy(() => import('./pages/InsightsPage').then((m) => ({ default: m.InsightsPage })));
const AuditPage = lazy(() => import('./pages/AuditPage').then((m) => ({ default: m.AuditPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

function PageLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
      <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
      <span className="text-xs text-slate-400 font-medium tracking-wide">Loading workspace...</span>
    </div>
  );
}

function AppContent() {
  const [currentTab, setCurrentTab] = useState('dashboard');

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
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
    >
      <Suspense fallback={<PageLoadingFallback />}>
        {renderContent()}
      </Suspense>
    </Layout>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
