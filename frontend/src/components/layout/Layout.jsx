import React, { memo, useState, useCallback } from 'react';
import { 
  LayoutDashboard, 
  FileCheck2, 
  BookOpen, 
  CheckSquare2, 
  History, 
  BarChart3, 
  Settings 
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const Layout = memo(function Layout({ children, currentTab, onSelectTab }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleSelectTab = useCallback((tabId) => {
    onSelectTab(tabId);
    setIsMobileMenuOpen(false);
  }, [onSelectTab]);

  const mobileNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'review', label: 'Review', icon: FileCheck2 },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100/60 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar
        onToggleMobileMenu={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex flex-1 pt-16">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 sm:pb-20 lg:pb-8 min-w-0 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Modern Mobile Bottom Navigation Bar (Visible on screens < 640px / sm) */}
      <nav aria-label="Mobile navigation" className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-2px_12px_rgba(0,0,0,0.05)] safe-area-bottom px-2 py-1">
        <div className="flex items-center justify-around">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  onSelectTab(item.id);
                  closeMobileMenu();
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
                  isActive 
                    ? 'text-brand-600 font-bold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className={`p-1 rounded-lg transition-transform ${
                  isActive ? 'bg-brand-50 scale-110' : ''
                }`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
});

export default Layout;
