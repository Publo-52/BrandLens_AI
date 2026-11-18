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
  const [loadError, setLoadError] = useState(null);

  const loadDashboardData = React.useCallback(async () => {
    if (!activeOrg?._id || !token) {
      setContents([]);
      setStats({ totalDrafts: 0, inReview: 0, approved: 0, guidelinesCount: 0 });
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [contentsRes, guidelinesRes, factsRes] = await Promise.allSettled([
        api.getContents(activeOrg._id, token),
        api.getGuidelines(activeOrg._id, token),
        api.getFacts(activeOrg._id, token),
      ]);

      const rejected = [contentsRes, guidelinesRes, factsRes].filter((r) => r.status === 'rejected');
      if (rejected.length === 3) {
        setLoadError(rejected[0].reason?.message || 'Unable to load workspace metrics. Please check your connection.');
      }

      const allContents = contentsRes.status === 'fulfilled' ? contentsRes.value.contents || [] : [];
      setContents(allContents);

      const inReviewCount = allContents.filter((c) => c.status === 'IN_REVIEW').length;
      const approvedCount = allContents.filter((c) => c.status === 'APPROVED' || c.status === 'PUBLISHED').length;
      const totalGuidelines =
        (guidelinesRes.status === 'fulfilled' ? guidelinesRes.value.guidelines?.length || 0 : 0) +
        (factsRes.status === 'fulfilled' ? factsRes.value.facts?.length || 0 : 0);

      setStats({
        totalDrafts: allContents.length,
        inReview: inReviewCount,
        approved: approvedCount,
        guidelinesCount: totalGuidelines,
      });
    } catch (err) {
      setLoadError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, [activeOrg?._id, token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const nav = (tab) => {
    if (onNavigate) onNavigate(tab);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">PUBLISHED</span>;
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
      {loadError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={loadDashboardData}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs shrink-0"
          >
            Retry
          </button>
        </div>
      )}
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-7 text-white shadow-xl shadow-brand-950/10 border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Intelligent Brand Governance
              </span>
              {activeOrg && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/15 flex items-center gap-1.5 backdrop-blur-xs">
                  <Building2 className="w-3.5 h-3.5 text-brand-300" />
                  {activeOrg.name} &bull; <span className="text-brand-300">{activeRole}</span>
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Pre-Publication Brand Control
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Verify marketing copy against approved brand guidelines and corporate facts before publishing. 
              Prevent hallucinated claims, enforce deterministic terminology, and empower human reviewers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => nav('review')}
              className="px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Submit Draft</span>
            </button>
            <button
              onClick={() => nav('knowledge')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 active:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 backdrop-blur-xs"
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
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400 group-hover:h-1.5 transition-all" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
            {stats.inReview}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-2 flex items-center gap-1">
            <span>Awaiting Reviewer sign-off</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div 
          onClick={() => nav('review')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-500 group-hover:h-1.5 transition-all" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active Submissions</span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
            {stats.totalDrafts}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2 flex items-center gap-1">
            <span>Documents in workspace</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform text-slate-400" />
          </div>
        </div>

        <div 
          onClick={() => nav('audit')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 group-hover:h-1.5 transition-all" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Approved for Publish</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2 font-mono">
            {stats.approved}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <span>Locked & compliant copies</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div 
          onClick={() => nav('knowledge')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 group-hover:h-1.5 transition-all" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Brand Rules & Facts</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2 font-mono">
            {stats.guidelinesCount}
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-2 flex items-center gap-1">
            <span>Tone, terms & approved facts</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Action Modules Quick Launch Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Governance Modules</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Quick workspace actions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Review Content */}
          <div 
            onClick={() => nav('review')}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:border-brand-400/80 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                Content Intake & Review
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Submit marketing copy, verify against brand rules, inspect grounded citations, and review intent-preserving AI suggestions.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-brand-600 group-hover:gap-2 transition-all pt-2 border-t border-slate-100">
              <span>Open Review Studio</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Approval Queue */}
          <div 
            onClick={() => nav('approvals')}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:border-amber-400/80 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <CheckSquare2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                Approval Queue
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dedicated queue for Managers and Reviewers to inspect evidence, post comments, justify policy overrides, and grant sign-offs.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-amber-600 group-hover:gap-2 transition-all pt-2 border-t border-slate-100">
              <span>Review Submissions ({stats.inReview})</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Brand Knowledge Base */}
          <div 
            onClick={() => nav('knowledge')}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:border-indigo-400/80 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                Brand Knowledge Base
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manage versioned tone guidelines, approved corporate facts, deterministic terminology dictionary, and WCAG color tokens.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-indigo-600 group-hover:gap-2 transition-all pt-2 border-t border-slate-100">
              <span>Manage Knowledge Base</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Governance Insights */}
          <div 
            onClick={() => nav('insights')}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:border-purple-400/80 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                Governance Insights
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Track recurring brand mistakes, human override rates, and identify ambiguous guidelines needing clarification.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-purple-600 group-hover:gap-2 transition-all pt-2 border-t border-slate-100">
              <span>View Analytics</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Audit Trail & Certificates */}
          <div 
            onClick={() => nav('audit')}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:border-emerald-400/80 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <History className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                Audit Trail & Certificates
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Immutable ledger of reviewer decisions, override justifications, and tamper-evident Pre-Publication Certificates.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-emerald-600 group-hover:gap-2 transition-all pt-2 border-t border-slate-100">
              <span>Inspect Audit Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: Workspace Settings */}
          <div 
            onClick={() => nav('settings')}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:border-slate-400/80 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center shadow-md shadow-slate-900/20 group-hover:scale-105 transition-transform">
                <Settings className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-slate-900 transition-colors">
                Workspace Settings & Team
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manage team memberships, invite collaborators, configure RBAC permissions, and view organisation details.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-slate-700 group-hover:gap-2 transition-all pt-2 border-t border-slate-100">
              <span>Configure Workspace</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 px-6 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Submissions in Workspace
            </h3>
          </div>
          <button 
            onClick={() => nav('review')}
            className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 transition-colors hover:translate-x-0.5"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {contents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileCheck2 className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="text-xs font-semibold text-slate-700">No submissions in this workspace yet</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Run your first brand review by submitting marketing copy or a campaign document.
            </p>
            <button
              onClick={() => nav('review')}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit First Draft</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {contents.slice(0, 5).map((item) => (
              <div 
                key={item._id}
                onClick={() => nav(item.status === 'IN_REVIEW' ? 'approvals' : 'review')}
                className="p-3.5 sm:p-4 px-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer group"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">
                      {item.title}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                      {item.channel || 'Social Media'}
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="truncate max-w-[200px]">Audience: {item.targetAudience || 'General Audience'}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="font-mono text-slate-400">v{item.currentVersionNumber || 1}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-brand-50 text-slate-400 group-hover:text-brand-600 flex items-center justify-center transition-colors">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
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
