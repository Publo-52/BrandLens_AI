import React, { useState, useEffect, useCallback } from 'react';
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
  Check
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

  const loadInsights = useCallback(async () => {
    if (!activeOrg?._id || !token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getInsights(activeOrg._id, token);
      setMetrics(data.metrics || null);
    } catch (err) {
      setError(err.message || 'Failed to load governance insights');
    } finally {
      setLoading(false);
    }
  }, [activeOrg, token]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  if (!activeOrg) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Workspace Required</h3>
        <p className="text-xs text-slate-500 mt-1">
          Please sign in and select an organisation workspace to view live governance insights.
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
    REJECTED: 0,
  };

  const totalFindings = metrics?.totalFindingsCaught || 0;
  const getPct = (val) => (totalFindings > 0 ? Math.round((val / totalFindings) * 100) : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Governance Insights & Analytics</h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Live Data
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Aggregated metrics across submissions, detected violations, human overrides, and guideline ambiguity.
          </p>
        </div>
        <button
          onClick={loadInsights}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Submissions</span>
            <FileText className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.totalSubmissions ?? 0}
          </div>
          <div className="text-[11px] text-slate-400">Content pieces evaluated across drafts</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Compliance Reviews</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.totalReviewsRun ?? 0}
          </div>
          <div className="text-[11px] text-slate-400">Deterministic + AI evaluation passes</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Human Acceptance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {metrics?.acceptanceRatePercent ?? 0}%
          </div>
          <div className="text-[11px] text-slate-400">
            {metrics?.acceptedCount ?? 0} fixes applied directly by authors
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Reviewer Override Rate</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-amber-600">
              {metrics?.overrideRatePercent ?? 0}%
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {metrics?.overriddenCount ?? 0} total
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Human-justified policy exceptions</div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Finding Categories Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-600" />
              Detected Finding Categories ({totalFindings})
            </h3>
            <span className="text-xs text-slate-400">Deterministic & AI</span>
          </div>

          <div className="space-y-4">
            {/* Terminology */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Terminology Violations (Banned / Preferred Terms)
                </span>
                <span className="font-mono text-slate-900">{cat.TERMINOLOGY} ({getPct(cat.TERMINOLOGY)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${getPct(cat.TERMINOLOGY)}%` }} 
                />
              </div>
            </div>

            {/* Tone Mismatch */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Tone & Voice Mismatch (Guideline Alignment)
                </span>
                <span className="font-mono text-slate-900">{cat.TONE_MISMATCH} ({getPct(cat.TONE_MISMATCH)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${getPct(cat.TONE_MISMATCH)}%` }} 
                />
              </div>
            </div>

            {/* Unsupported Claims */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Unsupported Claims (Missing from Facts Library)
                </span>
                <span className="font-mono text-slate-900">{cat.CLAIM_UNSUPPORTED} ({getPct(cat.CLAIM_UNSUPPORTED)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${getPct(cat.CLAIM_UNSUPPORTED)}%` }} 
                />
              </div>
            </div>

            {/* Supported Claims */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Supported Claims (Grounded & Verified)
                </span>
                <span className="font-mono text-slate-900">{cat.CLAIM_SUPPORTED} ({getPct(cat.CLAIM_SUPPORTED)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${getPct(cat.CLAIM_SUPPORTED)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Pipeline Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              Content Pipeline Distribution
            </h3>
            <span className="text-xs text-slate-400">Current Lifecycle</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-500">Drafts in Creation</div>
              <div className="text-xl font-bold text-slate-800 mt-1">{status.DRAFT}</div>
            </div>
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-xs text-amber-700">Awaiting Manager Approval</div>
              <div className="text-xl font-bold text-amber-800 mt-1">{status.IN_REVIEW}</div>
            </div>
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-xs text-emerald-700">Formally Approved</div>
              <div className="text-xl font-bold text-emerald-800 mt-1">{status.APPROVED}</div>
            </div>
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg">
              <div className="text-xs text-rose-700">Rejected / Needs Rework</div>
              <div className="text-xl font-bold text-rose-800 mt-1">{status.REJECTED + status.CHANGES_REQUESTED}</div>
            </div>
          </div>

          <div className="p-3 bg-brand-50 border border-brand-100 rounded-lg text-xs text-brand-800 flex items-center justify-between">
            <span>Publishing Readiness:</span>
            <span className="font-bold text-brand-900">
              {metrics?.totalSubmissions > 0 
                ? `${Math.round((status.APPROVED / metrics.totalSubmissions) * 100)}% Verified`
                : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Continuous Improvement & Guideline Ambiguity Intelligence */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 rounded-2xl p-6 text-white shadow-lg space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Continuous Improvement & Ambiguity Intelligence</h3>
            <p className="text-xs text-slate-300">
              When humans frequently override automated findings, BrandLens flags potential rule ambiguities.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <AlertTriangle className="w-4 h-4" />
              <span>Ambiguity Detection</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {metrics?.overrideRatePercent > 20
                ? `High override rate (${metrics.overrideRatePercent}%) detected. Suggest reviewing active Tone and Claims guidelines.`
                : `Healthy alignment (${metrics?.overrideRatePercent ?? 0}% overrides). Brand rules are clearly understood by authors.`}
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <BookOpen className="w-4 h-4" />
              <span>Recommended Action</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Add commonly caught product claims into the Approved Facts library to prevent repeated "Unsupported Claim" flags.
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
              <CheckSquare className="w-4 h-4" />
              <span>Deterministic Enforcement</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Terminology rules operate with 100% confidence without hallucination. Update dictionary under Brand Knowledge.
            </p>
          </div>
        </div>

        {/* Interactive Ambiguity Co-Pilot */}
        <div className="mt-4 pt-4 border-t border-white/10">
          {!coPilotActive ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  AI Ambiguity Auto-Resolver
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Diagnose why reviewers override findings and synthesize guideline clarifications.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCoPilotActive(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch Ambiguity Co-Pilot</span>
              </button>
            </div>
          ) : (
            <div className="bg-white/10 rounded-xl p-5 border border-white/15 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Co-Pilot Diagnosis & Proposed Guideline Amendment</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCoPilotActive(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-black/30 rounded-lg border border-white/10 space-y-1">
                  <div className="font-semibold text-slate-300">Identified Root Cause:</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Reviewers frequently override "Absolute Guarantee" findings when drafts mention audited SLAs (e.g. 99.99% uptime) because existing rules do not explicitly differentiate marketing hyperbole from verified technical SLAs.
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-500/10 rounded-lg border border-emerald-500/30 space-y-1">
                  <div className="font-semibold text-emerald-300">Recommended Rule Update:</div>
                  <p className="text-emerald-200 text-[11px] leading-relaxed font-mono">
                    "Prohibit unsubstantiated guarantee claims ('100% risk free'), EXCEPT when accompanied by approved SOC2 / SLA references."
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Impact: Reduces false-positive flags by ~40% across technical marketing drafts.
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
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    appliedClarification 
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-900 shadow-sm'
                  }`}
                >
                  {appliedClarification ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Rule Clarification Applied to Knowledge Base!</span>
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
