import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function Layout({ children, currentTab, onSelectTab, backendHealth, aiHealth, loading, onRefresh }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        backendHealth={backendHealth}
        aiHealth={aiHealth}
        loading={loading}
        onRefresh={onRefresh}
      />
      <div className="flex flex-1">
        <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}
