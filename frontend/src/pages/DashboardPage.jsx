import React from 'react';
import { 
  Server, 
  Database, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Layers, 
  FileCheck2,
  Users,
  Compass,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../features/auth/AuthContext';

export function DashboardPage({ backendHealth, aiHealth, loading, onRefresh }) {
  const { user, activeOrg, activeRole } = useAuth();
  const isBackendHealthy = backendHealth?.status === 'healthy';
  const isAiHealthy = aiHealth?.aiServiceStatus === 'reachable';
  const isDbConnected = backendHealth?.database?.status === 'connected';

  const milestones = [
    { id: 1, title: 'Foundation', status: 'Completed', desc: 'Architecture, frontend shell, Express API, FastAPI service, DB config, and health monitoring.' },
    { id: 2, title: 'Authentication & Workspace Security', status: 'Completed', desc: 'Registration, login, JWT sessions, organisations, memberships, and server-side RBAC.' },
    { id: 3, title: 'Brand Knowledge Base', status: 'Completed', desc: 'Versioned guidelines, approved facts, deterministic terminology rules, and assets.' },
    { id: 4, title: 'Content Intake & Parsing', status: 'Next', desc: 'Multi-format intake for plain text, PDF, DOCX, and JPG/PNG documents.' },
    { id: 5, title: 'Explainable Review Engine', status: 'Planned', desc: 'Terminology check, grounded fact retrieval, tone check, and validated findings.' },
    { id: 6, title: 'Suggestions & Human Workflow', status: 'Planned', desc: 'Accept/edit/reject, reviewer comments, overrides with reasons, and approval locking.' },
    { id: 7, title: 'Visual Checks & Governance Insights', status: 'Planned', desc: 'Palette/logo validation, WCAG contrast checks, and recurring error dashboards.' },
    { id: 8, title: 'Quality, Deployment & Demo', status: 'Planned', desc: 'Full automated testing, audit export, demo script, and final report.' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-200 border border-brand-400/30">
                Milestone 1 Active
              </span>
              <span className="text-xs text-slate-300">Team ALGO_X &bull; GIST</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">BrandLens AI Governance Platform</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Intelligent brand governance, before you publish. Verifies drafts against approved guidelines and facts, suggests intent-preserving fixes, and keeps authorised humans in control.
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="self-start md:self-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-brand-500/30"
          >
            Check System Status
          </button>
        </div>
      </div>

      {/* Service Health Cards */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-600" />
          Foundation Service Health & Connectivity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Node.js Backend Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <StatusBadge
                status={isBackendHealthy ? 'healthy' : 'unreachable'}
                label={isBackendHealthy ? 'Healthy' : 'Unreachable'}
              />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Node.js Express API</h4>
              <p className="text-xs text-slate-500 mt-0.5">Port 5000 &bull; Express 4.21 &bull; RBAC & Workflow</p>
            </div>
            <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Environment:</span>
                <span className="font-mono">{backendHealth?.environment || 'unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Uptime:</span>
                <span className="font-mono">{backendHealth?.uptimeSeconds ? `${backendHealth.uptimeSeconds}s` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* MongoDB Database Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <StatusBadge
                status={isDbConnected ? 'connected' : 'disconnected'}
                label={isDbConnected ? 'Connected' : 'Offline / Degraded'}
              />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">MongoDB Database</h4>
              <p className="text-xs text-slate-500 mt-0.5">Mongoose ODM &bull; Multi-Tenant Scoping</p>
            </div>
            <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Connection State:</span>
                <span className="font-mono capitalize">{backendHealth?.database?.state || 'disconnected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target:</span>
                <span className="font-mono text-[11px] truncate max-w-[160px]">{backendHealth?.database?.uri || 'mongodb://localhost:27017'}</span>
              </div>
            </div>
          </div>

          {/* Python AI Service Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <StatusBadge
                status={isAiHealthy ? 'reachable' : 'unreachable'}
                label={isAiHealthy ? 'Reachable' : 'Unreachable'}
              />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Python FastAPI AI Engine</h4>
              <p className="text-xs text-slate-500 mt-0.5">Port 8000 &bull; Python 3.13 &bull; Grounded Checks</p>
            </div>
            <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">AI Service URL:</span>
                <span className="font-mono">{aiHealth?.aiServiceUrl || 'http://localhost:8000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Capabilities:</span>
                <span className="font-mono">Deterministic + AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture & Milestone Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            BrandLens Implementation Roadmap
          </h3>
          <div className="space-y-3">
            {milestones.map((m) => (
              <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="mt-0.5">
                  {m.status === 'Completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : m.status === 'Next' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-brand-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-brand-600" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-800">
                      M{m.id}: {m.title}
                    </h4>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                      m.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : m.status === 'Next'
                        ? 'bg-brand-50 text-brand-700 border border-brand-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Responsible AI & Team Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-600" />
              Core Governance Principles
            </h3>
            <ul className="text-xs text-slate-600 space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>No Hallucinated Citations:</strong> Every finding must link to an approved brand rule, or explicitly state "Unsupported".</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Human in Control:</strong> AI only suggests fixes; humans review, edit, reject, and approve.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Workspace Isolation:</strong> All data queries are strictly scoped by organisation ID.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Append-Only Audit:</strong> All overrides and approval decisions require justification notes.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 mb-2">
              <Users className="w-4 h-4" />
              TEAM ALGO_X ROLES
            </div>
            <div className="text-xs space-y-2 text-slate-300">
              <div><strong className="text-white">Ranjan Mondal:</strong> Full-stack, Review Workspace & State Machine</div>
              <div><strong className="text-white">Sukhen Das:</strong> Full-stack, Auth/RBAC, FastAPI & Brand Checks</div>
              <div><strong className="text-white">Joy Khatua:</strong> Database, Mongoose Models & Embeddings</div>
              <div><strong className="text-white">Chandan Patra:</strong> Analysis, Research, Testing & Verification</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
