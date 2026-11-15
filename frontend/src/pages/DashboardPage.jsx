import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  CheckSquare2, 
  BookOpen, 
  BarChart3, 
  History, 
  Settings, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Building2, 
  Users 
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { api } from '../services/api';

export function DashboardPage({ onNavigate }) {
  const { user, activeOrg, activeRole, token } = useAuth();
  const [contents, setContents] = useState([]);
  const [stats, setStats] = useState({
    totalDrafts: 0,
    inReview: 0,
    approved: 0,
    guidelinesCount: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      if (!activeOrg?._id || !token) return;
      setLoading(true);
      try {
        const [contentsRes, guidelinesRes, factsRes] = await Promise.allSettled([
          api.getContents(activeOrg._id, token),
          api.getGuidelines(activeOrg._id, token),
          api.getFacts(activeOrg._id, token),
        ]);

        const allContents = contentsRes.status === 'fulfilled' ? contentsRes.value.contents || [] : [];
        setContents(allContents);

        const inReviewCount = allContents.filter((c) => c.status === 'IN_REVIEW').length;
        const approvedCount = allContents.filter((c) => c.status === 'APPROVED').length;
        const totalGuidelines = (guidelinesRes.status === 'fulfilled' ? guidelinesRes.value.guidelines?.length || 0 : 0) +
                                (factsRes.status === 'fulfilled' ? factsRes.value.facts?.length || 0 : 0);

        setStats({
          totalDrafts: allContents.length,
          inReview: inReviewCount,
          approved: approvedCount,
          guidelinesCount: totalGuidelines,
        });
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [activeOrg, token]);

  const nav = (tab) => {
    if (onNavigate) onNavigate(tab);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">APPROVED</span>;
      case 'IN_REVIEW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">IN REVIEW</span>;
      case 'CHANGES_REQUESTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">CHANGES REQUESTED</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">REJECTED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">DRAFT</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Intelligent Brand Governance
              </span>
              {activeOrg && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-brand-300" />
                  {activeOrg.name} ({activeRole})
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pre-Publication Brand Control
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Verify marketing copy against approved brand guidelines and corporate facts before you publish. 
              Prevent hallucinated claims, enforce deterministic terminology, and empower human reviewers.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => nav('review')}
              className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold shadow-md transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Draft</span>
            </button>
            <button
              onClick={() => nav('knowledge')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-brand-300" />
              <span>Brand Guidelines</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => nav('approvals')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats.inReview}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
            <span>Awaiting Manager / Reviewer sign-off</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div 
          onClick={() => nav('review')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Active Submissions</span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats.totalDrafts}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Total documents in workspace</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div 
          onClick={() => nav('audit')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Approved for Publishing</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {stats.approved}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>Locked & compliant versions</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div 
          onClick={() => nav('knowledge')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Brand Rules & Facts</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">
            {stats.guidelinesCount}
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1 flex items-center gap-1">
            <span>Tone, terms & approved facts</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Action Modules Quick Launch Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            Governance Workspaces
          </h3>
          <span className="text-xs text-slate-400">Select a workflow to proceed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Review Content */}
          <div 
            onClick={() => nav('review')}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-brand-400 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                Content Intake & Review
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Submit marketing copy, verify against brand rules, review grounded factual citations, and inspect intent-preserving AI suggestions.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-brand-600 group-hover:gap-2 transition-all">
              <span>Open Review Studio</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 2: Approval Queue */}
          <div 
            onClick={() => nav('approvals')}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <CheckSquare2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                Approval Queue
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dedicated queue for Managers and Reviewers to inspect evidence, post comments, justify policy overrides, and grant formal approvals.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-amber-600 group-hover:gap-2 transition-all">
              <span>Review Submissions ({stats.inReview})</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 3: Brand Knowledge Base */}
          <div 
            onClick={() => nav('knowledge')}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                Brand Knowledge Base
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manage versioned tone guidelines, approved corporate facts, deterministic terminology dictionary, and color tokens.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-indigo-600 group-hover:gap-2 transition-all">
              <span>Manage Knowledge Base</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 4: Governance Insights */}
          <div 
            onClick={() => nav('insights')}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-purple-400 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                Governance Insights
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Track recurring brand mistakes, human override rates, and identify ambiguous guidelines needing clarification.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-purple-600 group-hover:gap-2 transition-all">
              <span>View Analytics</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 5: Audit Trail & Certificates */}
          <div 
            onClick={() => nav('audit')}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <History className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                Audit Trail & Certificates
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Immutable ledger of all reviewer decisions, override justifications, and download tamper-evident Pre-Publication Certificates.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-600 group-hover:gap-2 transition-all">
              <span>Inspect Audit Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Card 6: Workspace Settings */}
          <div 
            onClick={() => nav('settings')}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-400 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-slate-900 transition-colors">
                Workspace Settings & Team
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manage team memberships, invite collaborators, configure RBAC role permissions, and view organisation details.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-slate-700 group-hover:gap-2 transition-all">
              <span>Configure Workspace</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions Feed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Submissions in Workspace
            </h3>
          </div>
          <button 
            onClick={() => nav('review')}
            className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {contents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No submissions in this workspace yet. Click <strong>Submit Draft</strong> to run your first brand review!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {contents.slice(0, 5).map((item) => (
              <div 
                key={item._id}
                onClick={() => nav(item.status === 'IN_REVIEW' ? 'approvals' : 'review')}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 truncate">
                      {item.title}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>Channel: {item.channel || 'Social Media'}</span>
                    <span>&bull;</span>
                    <span>Audience: {item.targetAudience || 'General Audience'}</span>
                    <span>&bull;</span>
                    <span>Version: v{item.currentVersionNumber || 1}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Core Responsible Governance Principles */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 rounded-2xl p-6 text-white shadow-lg space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Responsible Brand Governance Principles</h3>
            <p className="text-xs text-slate-300">
              How BrandLens AI safeguards brand integrity without taking away human decision authority.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-1.5">
            <div className="text-xs font-bold text-emerald-300">100% Deterministic Terms</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Banned words and preferred terminology are enforced with exact string matches — never hallucinated.
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-1.5">
            <div className="text-xs font-bold text-amber-300">Grounded Fact Verification</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Factual claims must cite a verified record in the Approved Facts library or be clearly flagged as Unsupported.
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-1.5">
            <div className="text-xs font-bold text-sky-300">Human in Control</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              AI only suggests intent-preserving edits. Human authors and managers review, accept, reject, or override.
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-1.5">
            <div className="text-xs font-bold text-purple-300">Immutable Audit Trail</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every decision and override reason is logged in a tamper-evident audit ledger with exportable compliance certificates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
