import React from 'react';
import { 
  LayoutDashboard, 
  FileCheck2, 
  BookOpen, 
  CheckSquare2, 
  BarChart3, 
  History, 
  Settings 
} from 'lucide-react';

export function Sidebar({ currentTab, onSelectTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'review', label: 'Review Content', icon: FileCheck2 },
    { id: 'knowledge', label: 'Brand Knowledge', icon: BookOpen },
    { id: 'approvals', label: 'Approval Queue', icon: CheckSquare2 },
    { id: 'insights', label: 'Governance Insights', icon: BarChart3 },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'settings', label: 'Workspace Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 mb-2">
          Navigation
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-200 text-xs text-slate-400">
        <div className="font-semibold text-slate-600">BrandLens AI v1.0.0</div>
        <div className="mt-0.5">Team ALGO_X &bull; Round 1</div>
      </div>
    </aside>
  );
}
