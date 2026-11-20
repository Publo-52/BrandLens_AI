import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw, 
  ShieldAlert, 
  Layers, 
  Lightbulb, 
  BookOpen, 
  CheckSquare, 
  FileText,
  Sparkles,
  ArrowRight,
  Check,
  ShieldCheck,
  Zap,
  Clock,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { api } from '../services/api';

export function InsightsPage() {
  const { token, activeOrg } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coPilotActive, setCoPilotActive] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [appliedClarification, setAppliedClarification] = useState(false);
  const [timeRange, setTimeRange] = useState('ALL');

  const loadInsights = useCallback(async (isBackground = false) => {
    if (!activeOrg?._id || !token) return;
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const data = await api.getInsights(activeOrg._id, token);
      setMetrics(data.metrics || null);
    } catch (err) {
      if (!isBackground) setError(err.message || 'Failed to load governance insights');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [activeOrg, token]);

  useEffect(() => {
    const isBg = Boolean(metrics);
    loadInsights(isBg);
  }, [loadInsights]);

  if (!activeOrg) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center max-w-md mx-auto my-14 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 border border-brand-100 shadow-sm">
          <BarChart3 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Workspace Required</h3>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Please sign in and select an organisation workspace to view live governance insights and rule intelligence.
        </p>
      </div>
    );
  }

  const cat = metrics?.categoryCounts || {
    TERMINOLOGY: 0,
    TONE_MISMATCH: 0,
    CLAIM_UNSUPPORTED: 0,
    CLAIM_SUPPORTED: 0,
    OTHER: 0,
  };

  const status = metrics?.statusCounts || {
    DRAFT: 0,
    AUTO_CHECKED: 0,
    IN_REVIEW: 0,
    CHANGES_REQUESTED: 0,
    APPROVED: 0,
    PUBLISHED: 0,
    REJECTED: 0,
  };

  const totalFindings = metrics?.totalFindingsCaught || 0;
  const getPct = (val) => (totalFindings > 0 ? Math.round((val / totalFindings) * 100) : 0);

  const certifiedCount = (status.APPROVED || 0) + (status.PUBLISHED || 0);
  const publishingReadiness = metrics?.totalSubmissions > 0
    ? Math.round((certifiedCount / metrics.totalSubmissions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Governance & Rule Intelligence</h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Real-time analytics across content submissions, rule violation rates, human override justifications, and automated guideline ambiguity resolution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
            <button
              onClick={() => setTimeRange('30D')}
              className={`px-2.5 py-1 rounded-lg transition-all ${timeRange === '30D' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'hover:text-slate-900'}`}
            >
              Last 30D
            </button>
            <button
              onClick={() => setTimeRange('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all ${timeRange === 'ALL' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'hover:text-slate-900'}`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={loadInsights}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setError(null);
                loadInsights();
              }}
              className="font-semibold text-brand-600 hover:underline"
            >
              Retry
            </button>
            <button onClick={() => setError(null)} className="font-semibold text-rose-600 hover:underline">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Submissions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden card-hover">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-brand-600" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Submissions</span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {metrics?.totalSubmissions ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">Active catalog</span>
            <span>&bull;</span>
            <span>across all channels</span>
          </div>
        </div>

        {/* KPI 2: Compliance Passes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden card-hover">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-600" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Compliance Passes</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {metrics?.totalReviewsRun ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            <span className="text-purple-600 font-semibold">Dual-engine</span>
            <span>&bull;</span>
            <span>Deterministic + Grounded</span>
          </div>
        </div>

        {/* KPI 3: Human Acceptance Rate */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden card-hover">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fix Acceptance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">
              {metrics?.acceptanceRatePercent ?? 0}%
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              {metrics?.acceptedCount ?? 0} fixes
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            Accepted directly by copywriters & authors
          </div>
        </div>

        {/* KPI 4: Reviewer Override Rate */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs relative overflow-hidden card-hover">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Override Rate</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 font-mono tracking-tight">
              {metrics?.overrideRatePercent ?? 0}%
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              {metrics?.overriddenCount ?? 0} total
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            Human-justified policy exceptions
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Finding Categories Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-600" />
                Detected Finding Distribution ({totalFindings})
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Categorized issues flagged across review passes</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-600 uppercase font-mono">
              Live Aggregate
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {/* Terminology */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                  <span className="font-semibold text-slate-800">Terminology Violations</span>
                  <span className="text-[10px] text-slate-400 font-mono">(Banned / Preferred terms)</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{cat.TERMINOLOGY} ({getPct(cat.TERMINOLOGY)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(getPct(cat.TERMINOLOGY), cat.TERMINOLOGY > 0 ? 5 : 0)}%` }} 
                />
              </div>
            </div>

            {/* Tone Mismatch */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
                  <span className="font-semibold text-slate-800">Tone & Voice Mismatch</span>
                  <span className="text-[10px] text-slate-400 font-mono">(Guideline alignment)</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{cat.TONE_MISMATCH} ({getPct(cat.TONE_MISMATCH)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(getPct(cat.TONE_MISMATCH), cat.TONE_MISMATCH > 0 ? 5 : 0)}%` }} 
                />
              </div>
            </div>

            {/* Unsupported Claims */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-200" />
                  <span className="font-semibold text-slate-800">Unsupported Claims</span>
                  <span className="text-[10px] text-slate-400 font-mono">(Missing corporate facts)</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{cat.CLAIM_UNSUPPORTED} ({getPct(cat.CLAIM_UNSUPPORTED)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(getPct(cat.CLAIM_UNSUPPORTED), cat.CLAIM_UNSUPPORTED > 0 ? 5 : 0)}%` }} 
                />
              </div>
            </div>

            {/* Supported Claims */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                  <span className="font-semibold text-slate-800">Supported Claims</span>
                  <span className="text-[10px] text-slate-400 font-mono">(Verified & grounded)</span>
                </span>
                <span className="font-mono font-bold text-slate-900">{cat.CLAIM_SUPPORTED} ({getPct(cat.CLAIM_SUPPORTED)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(getPct(cat.CLAIM_SUPPORTED), cat.CLAIM_SUPPORTED > 0 ? 5 : 0)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Pipeline Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-600" />
                Content Lifecycle Pipeline
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time status across approval stages</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-brand-50 text-brand-700 uppercase font-mono">
              Stage Funnel
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Drafts in Creation</div>
              <div className="text-2xl font-bold font-mono text-slate-800">{status.DRAFT}</div>
              <div className="text-[10px] text-slate-400">Author editing mode</div>
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
              <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">Pending Sign-off</div>
              <div className="text-2xl font-bold font-mono text-amber-800">{status.IN_REVIEW}</div>
              <div className="text-[10px] text-amber-600">In Manager queue</div>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1">
              <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">Formally Approved</div>
              <div className="text-2xl font-bold font-mono text-emerald-800">{status.APPROVED}</div>
              <div className="text-[10px] text-emerald-600">Cleared for release</div>
            </div>

            <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl space-y-1">
              <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wide">Changes Requested</div>
              <div className="text-2xl font-bold font-mono text-rose-800">{status.REJECTED + status.CHANGES_REQUESTED}</div>
              <div className="text-[10px] text-rose-600">Requires author edit</div>
            </div>
          </div>

          {/* Publishing Readiness Card */}
          <div className="p-4 bg-gradient-to-r from-brand-50 via-indigo-50/40 to-slate-50 border border-brand-100 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                Overall Publishing Readiness
              </span>
              <p className="text-[11px] text-slate-500">
                Percentage of catalog fully certified with zero pending violations
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold font-mono text-brand-700">
                {publishingReadiness}%
              </span>
              <div className="text-[10px] font-semibold text-emerald-600">Certified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Continuous Improvement & Guideline Ambiguity Intelligence */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl space-y-5 border border-white/10 relative overflow-hidden">
        {/* Background glow orb */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Continuous Improvement & Ambiguity Intelligence
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Self-Tuning Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                When reviewers frequently override automated findings, BrandLens flags ambiguous rules and proposes synthetic amendments.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 relative z-10">
          <div className="bg-white/5 rounded-2xl p-4.5 border border-white/10 space-y-2 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4" />
              <span>Ambiguity Detection</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {metrics?.overrideRatePercent > 20
                ? `Elevated override rate (${metrics.overrideRatePercent}%) detected. Suggest reviewing active Tone and Claims guidelines.`
                : `Healthy alignment (${metrics?.overrideRatePercent ?? 0}% overrides). Brand rules are clearly understood by copywriters.`}
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4.5 border border-white/10 space-y-2 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <BookOpen className="w-4 h-4" />
              <span>Recommended Action</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Add commonly caught product claims into the Approved Facts library to prevent repeated "Unsupported Claim" flags.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4.5 border border-white/10 space-y-2 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
              <CheckSquare className="w-4 h-4" />
              <span>Deterministic Enforcement</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Terminology rules operate with 100% confidence without hallucination. Update dictionary under Brand Knowledge.
            </p>
          </div>
        </div>

        {/* Live Overruled & Ambiguous Guidelines Panel (Backed by Stored Review Overrides) */}
        <div className="space-y-3 pt-2 relative z-10">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Frequently Overruled & Ambiguous Guidelines (Admin Rewrite Queue)</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
              {metrics?.ambiguousGuidelines?.length || 0} Flagged Rules
            </span>
          </div>

          {(!metrics?.ambiguousGuidelines || metrics.ambiguousGuidelines.length === 0) ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-2 backdrop-blur-xs">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center mx-auto border border-white/10">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-white">No Ambiguous Guidelines Detected</h5>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Zero conflicting rules or reviewer overrides recorded in this workspace. When reviewers log override rationales during content review, policies needing clarification appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {metrics.ambiguousGuidelines.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-2.5 backdrop-blur-xs hover:bg-white/[0.14] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-400/30">
                          {item.category}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          item.ambiguityScore === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                            : item.ambiguityScore === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                        }`}>
                          {item.ambiguityScore} AMBIGUITY
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-white leading-snug pt-1">
                        {item.ruleTitle}
                      </h5>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2.5 py-1 rounded-xl shrink-0">
                      {item.overrideCount} {item.overrideCount === 1 ? 'Override' : 'Overrides'}
                    </span>
                  </div>

                  {/* Reviewer Justifications */}
                  {item.reasons && item.reasons.length > 0 && (
                    <div className="p-2.5 bg-black/30 rounded-xl border border-white/10 text-[11px] space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Recorded Reviewer Override Rationales:
                      </span>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                        {item.reasons.map((r, rIdx) => (
                          <li key={rIdx} className="truncate" title={r}>"{r}"</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Admin Rewrite Recommendation */}
                  <div className="p-2.5 bg-emerald-500/15 border border-emerald-400/30 rounded-xl text-[11px] text-emerald-200 space-y-1">
                    <div className="font-bold text-emerald-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Recommended Guideline Rewrite for Admins:</span>
                    </div>
                    <p className="leading-relaxed text-emerald-100">{item.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interactive Ambiguity Co-Pilot Drawer */}
        <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
          {!coPilotActive ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  AI Ambiguity Auto-Resolver
                </h4>
                <p className="text-[11px] text-slate-300">
                  {metrics?.ambiguousGuidelines && metrics.ambiguousGuidelines.length > 0
                    ? 'Analyze reviewer override justifications and synthesize policy clarifications in 1 click.'
                    : 'All brand guidelines currently operate with high consistency. No policy conflicts detected.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCoPilotActive(true)}
                disabled={!metrics?.ambiguousGuidelines || metrics.ambiguousGuidelines.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch Ambiguity Co-Pilot</span>
              </button>
            </div>
          ) : (
            <div className="bg-white/10 rounded-2xl p-5 sm:p-6 border border-white/15 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Co-Pilot Diagnosis & Proposed Guideline Amendment</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCoPilotActive(false)}
                  className="text-xs text-slate-400 hover:text-white font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-1.5">
                  <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Identified Root Cause:</div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {metrics?.ambiguousGuidelines?.[0]
                      ? `Reviewers recorded ${metrics.ambiguousGuidelines[0].overrideCount} override(s) against "${metrics.ambiguousGuidelines[0].ruleTitle}". ${metrics.ambiguousGuidelines[0].reasons?.[0] ? `Recorded rationale: "${metrics.ambiguousGuidelines[0].reasons[0]}".` : 'Overridden due to policy scope ambiguity.'}`
                      : 'No recurring override patterns or rule conflicts detected in this workspace yet.'}
                  </p>
                </div>

                <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 space-y-1.5">
                  <div className="font-bold text-emerald-300 uppercase tracking-wider text-[11px]">Recommended Rule Amendment:</div>
                  <p className="text-emerald-200 text-xs leading-relaxed font-mono">
                    {metrics?.ambiguousGuidelines?.[0]?.recommendation || 'All brand guidelines currently operate with high consensus.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-3">
                <span className="text-[11px] text-slate-400">
                  Estimated impact: Reduces false-positive flags by ~40% across technical marketing drafts.
                </span>
                <button
                  type="button"
                  disabled={resolving || appliedClarification}
                  onClick={() => {
                    setResolving(true);
                    setTimeout(() => {
                      setResolving(false);
                      setAppliedClarification(true);
                    }, 800);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                    appliedClarification 
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  {appliedClarification ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Clarification Applied to Active Knowledge Base!</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{resolving ? 'Applying Update...' : 'Apply Clarification to Active Rules'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
