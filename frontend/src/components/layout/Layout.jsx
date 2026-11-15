import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function Layout({ children, currentTab, onSelectTab }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />
        <main className="flex-1 p-8 min-w-0 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}
