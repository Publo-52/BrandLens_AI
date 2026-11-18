import React, { useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileCheck2, 
  BookOpen, 
  CheckSquare2, 
  History, 
  BarChart3, 
  Settings,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Lock,
  X
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, tag: null },
  { id: 'review', label: 'Compliance Review', icon: FileCheck2, tag: 'Studio' },
  { id: 'knowledge', label: 'Brand Knowledge', icon: BookOpen, tag: 'Core' },
  { id: 'approvals', label: 'Approval Queue', icon: CheckSquare2, tag: 'Gate' },
  { id: 'insights', label: 'Governance Insights', icon: BarChart3, tag: 'AI' },
  { id: 'audit', label: 'Audit Trail & Certs', icon: History, tag: 'Ledger' },
  { id: 'settings', label: 'Workspace Settings', icon: Settings, tag: null },
];

function NavContent({ currentTab, onSelectTab, onItemClick }) {
  return (
    <div className="p-4 space-y-6 flex-1 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-3 mb-2 flex items-center justify-between">
            <span>Workspaces</span>
            <span className="text-[9px] font-mono text-slate-300">v1.0</span>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onItemClick) onItemClick();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-50 to-indigo-50/50 text-brand-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {/* Left indicator bar when active */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand-600 rounded-r-full" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`} />
                    <span className="tracking-tight">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.tag && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                        isActive
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                      }`}>
                        {item.tag}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom deterministic guarantee card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-brand-950 text-white shadow-sm border border-slate-800">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-200">Deterministic Guard</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          100% Terminology guarantee with exact corporate facts grounding.
        </p>
      </div>
    </div>
  );
}

export function Sidebar({ currentTab, onSelectTab, isOpen = false, onClose }) {
  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 1024px / lg) */}
      <aside aria-label="Main navigation" className="hidden lg:flex w-64 bg-white/80 backdrop-blur-md border-r border-slate-200/80 flex-col shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto select-none shadow-[1px_0_4px_rgba(0,0,0,0.015)]">
        <NavContent currentTab={currentTab} onSelectTab={onSelectTab} />
      </aside>

      {/* Mobile & Tablet Slide-Over Drawer (< 1024px / lg) */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      <aside
        role="dialog"
        aria-modal={isOpen ? 'true' : undefined}
        aria-label="Mobile navigation drawer"
        className={`lg:hidden fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-slate-900">BrandLens Navigation</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <NavContent currentTab={currentTab} onSelectTab={onSelectTab} onItemClick={onClose} />
        </div>
      </aside>
    </>
  );
}
