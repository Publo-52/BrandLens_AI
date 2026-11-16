import React, { memo } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const Layout = memo(function Layout({ children, currentTab, onSelectTab }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100/60 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />
        <main className="flex-1 p-6 sm:p-8 min-w-0 max-w-7xl overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
});

