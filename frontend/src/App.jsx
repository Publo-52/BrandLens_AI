import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewPage } from './pages/ReviewPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { InsightsPage } from './pages/InsightsPage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { useHealthCheck } from './hooks/useHealthCheck';
import { AuthProvider } from './features/auth/AuthContext';

function AppContent() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const { backendHealth, aiHealth, loading, refresh } = useHealthCheck(15000);

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardPage
            backendHealth={backendHealth}
            aiHealth={aiHealth}
            loading={loading}
            onRefresh={refresh}
          />
        );
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
        return (
          <DashboardPage
            backendHealth={backendHealth}
            aiHealth={aiHealth}
            loading={loading}
            onRefresh={refresh}
          />
        );
    }
  };

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      backendHealth={backendHealth}
      aiHealth={aiHealth}
      loading={loading}
      onRefresh={refresh}
    >
      {renderContent()}
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
