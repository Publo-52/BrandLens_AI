import React from 'react';
import { ShieldCheck, RefreshCw, Building2 } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export function Navbar({ backendHealth, aiHealth, loading, onRefresh }) {
  const beStatus = backendHealth?.status === 'healthy' ? 'healthy' : 'unreachable';
  const aiStatus = aiHealth?.aiServiceStatus === 'reachable' ? 'reachable' : 'unreachable';
  const dbStatus = backendHealth?.database?.status === 'connected' ? 'connected' : 'disconnected';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold shadow-sm shadow-brand-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-slate-900 text-base tracking-tight">BrandLens AI</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded border border-brand-200">
              Foundation
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">Intelligent brand governance, before you publish.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Workspace selector preview */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>NovaTech (Demo Org)</span>
        </div>

        {/* Live Service Health Indicators */}
        <div className="hidden lg:flex items-center gap-3 text-xs pl-3 border-l border-slate-200">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">API:</span>
            <StatusBadge status={beStatus} label={beStatus} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">DB:</span>
            <StatusBadge status={dbStatus} label={dbStatus} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">AI:</span>
            <StatusBadge status={aiStatus} label={aiStatus} />
          </div>
        </div>

        <button
          onClick={onRefresh}
          title="Refresh service health checks"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
        </button>

        {/* User Role Badge Placeholder */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
            AD
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800">Admin User</div>
            <div className="text-[10px] text-slate-500">ADMIN</div>
          </div>
        </div>
      </div>
    </header>
  );
}
