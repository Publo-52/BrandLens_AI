import React from 'react';
import { 
  LayoutDashboard, 
  FileCheck2, 
  BookOpen, 
  CheckSquare2, 
  BarChart3, 
  History, 
  Settings,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tag: null },
  { id: 'review', label: 'Review Content', icon: FileCheck2, tag: 'Studio' },
  { id: 'knowledge', label: 'Brand Knowledge', icon: BookOpen, tag: null },
  { id: 'approvals', label: 'Approval Queue', icon: CheckSquare2, tag: null },
  { id: 'insights', label: 'Governance Insights', icon: BarChart3, tag: null },
  { id: 'audit', label: 'Audit Trail', icon: History, tag: 'Ledger' },
  { id: 'settings', label: 'Workspace Settings', icon: Settings, tag: null },
];

export function Sidebar({ currentTab, onSelectTab }) {
  return (
    <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-slate-200/80 flex flex-col shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto select-none shadow-[1px_0_4px_rgba(0,0,0,0.015)]">
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-3 mb-2 flex items-center justify-between">
            <span>Workspaces</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-50 via-brand-50/70 to-indigo-50/40 text-brand-700 font-bold shadow-xs border border-brand-200/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-brand-600 stroke-[2.2]' : 'text-slate-400 group-hover:text-slate-600'
                    }`} />
                    <span>{item.label}</span>
                  </div>

                  {item.tag && (
                    <span className={`text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      {item.tag}
                    </span>
                  )}

                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-brand-600" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Brand Governance Status Card */}
        <div className="p-3.5 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 rounded-2xl text-white shadow-sm border border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold tracking-tight text-white">
              Deterministic Guard
            </span>
          </div>
          <p className="text-[10px] text-slate-300 leading-relaxed">
            Zero hallucinated terms. Verified approved facts citation engine active.
          </p>
          <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-700/60 font-mono">
            <span>LEXICON CACHE</span>
            <span className="text-emerald-400 font-bold">READY</span>
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-slate-200/80 text-[11px] text-slate-400 flex items-center justify-between">
        <div>
          <span className="font-bold text-slate-700">BrandLens AI</span>
          <span className="text-slate-400 ml-1.5">v1.0</span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
          ALGO_X
        </span>
      </div>
    </aside>
  );
}
