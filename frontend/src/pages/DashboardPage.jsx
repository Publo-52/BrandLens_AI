import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Users,
  Copy,
  Check,
  Search,
  Filter,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Lock,
  RefreshCw,
  FileText
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
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showEngineGuide, setShowEngineGuide] = useState(false);

  const loadDashboardData = React.useCallback(async (isBackground = false) => {
    if (!activeOrg?._id || !token) {
      setContents([]);
      setStats({ totalDrafts: 0, inReview: 0, approved: 0, guidelinesCount: 0 });
      setLoadError(null);
      return;
    }
    if (!isBackground) setLoading(true);
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
      if (!isBackground) {
        setLoadError(err.message || 'Failed to load dashboard metrics.');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [activeOrg?._id, token]);

  useEffect(() => {
    const isBg = contents.length > 0 || stats.totalDrafts > 0;
    loadDashboardData(isBg);
  }, [loadDashboardData]);

  const handleSeedDemoPack = async () => {
    if (!activeOrg?._id || !token || seedingDemo) return;
    setSeedingDemo(true);
    setLoadError(null);
    setSeedSuccess(null);
    try {
      const res = await api.seedDemoBrandPack(activeOrg._id, token);
      const guidelinesCount = res.seeded?.guidelines || 0;
      const factsCount = res.seeded?.facts || 0;
      const termsCount = res.seeded?.terminology || 0;
      setSeedSuccess(`Sample Brand Pack loaded! Added ${guidelinesCount} guidelines, ${factsCount} facts, and ${termsCount} terms.`);
      await loadDashboardData(false);
    } catch (err) {
      setLoadError(err.message || 'Failed to seed sample brand pack.');
    } finally {
      setSeedingDemo(false);
    }
  };

  const handleCopyApproved = async (item, e) => {
    e.stopPropagation();
    try {
      const latestText = item.versions?.[item.versions.length - 1]?.text || item.text || '';
      if (!latestText) {
        // Fetch full content if versions weren't populated in summary
        const detail = await api.getContent(activeOrg._id, item._id, token);
        const resolvedText = detail.content?.versions?.[detail.content.versions.length - 1]?.text || detail.content?.text || '';
        await navigator.clipboard.writeText(resolvedText);
      } else {
        await navigator.clipboard.writeText(latestText);
      }
      setCopiedId(item._id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.error('Failed to copy approved text:', err);
    }
  };

  const filteredContents = useMemo(() => {
    return contents.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const channelMatch = (item.channel || '').toLowerCase().includes(query);
        const audienceMatch = (item.audience || item.targetAudience || '').toLowerCase().includes(query);
        return titleMatch || channelMatch || audienceMatch;
      }
      return true;
    });
  }, [contents, statusFilter, searchQuery]);

  const isFreshWorkspace = stats.totalDrafts === 0 && stats.guidelinesCount === 0;

  const nav = (tab) => {
    if (onNavigate) onNavigate(tab);
  };

  const handleCardKeyDown = (tab) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      nav(tab);
    }
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

      {seedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{seedSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSeedSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3-Step Getting Started Checklist & Onboarding */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200 uppercase tracking-wider">
                Getting Started Checklist
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {(stats.guidelinesCount > 0 ? 1 : 0) + (stats.totalDrafts > 0 ? 1 : 0) + (stats.approved > 0 ? 1 : 0)} of 3 steps completed
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Launch Your Brand Governance in 3 Simple Steps
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              BrandLens AI ensures every marketing claim, logo, and phrase complies with your brand standards before publishing.
            </p>
          </div>

          {/* Sample Brand Pack Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSeedDemoPack}
              disabled={seedingDemo}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-indigo-50 to-brand-50 hover:from-indigo-100 hover:to-brand-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              title="Loads the sample NovaTech Global brand rules, approved facts, and WCAG palette so you can test reviews immediately."
            >
              <Sparkles className={`w-3.5 h-3.5 text-indigo-600 ${seedingDemo ? 'animate-spin' : ''}`} />
              <span>{seedingDemo ? 'Seeding Sample Pack...' : 'Try with Sample Brand Pack'}</span>
              <span className="text-[9px] font-mono font-bold bg-indigo-200/60 text-indigo-800 px-1.5 py-0.5 rounded uppercase">
                Sample
              </span>
            </button>
          </div>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            stats.guidelinesCount > 0 
              ? 'bg-emerald-50/40 border-emerald-200/80' 
              : 'bg-slate-50/70 border-slate-200/80 hover:border-brand-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 1</span>
              {stats.guidelinesCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>Configured ({stats.guidelinesCount})</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Required
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Add Brand Rules & Approved Facts</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Define approved messaging, certified corporate facts (e.g. ISO certs, SLAs), or banned terminology so our engine has guidelines to enforce.
            </p>
            <button
              onClick={() => nav('knowledge')}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-brand-600" />
              <span>Open Brand Knowledge Base</span>
            </button>
          </div>

          {/* Step 2 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            stats.totalDrafts > 0 
              ? 'bg-emerald-50/40 border-emerald-200/80' 
              : 'bg-slate-50/70 border-slate-200/80 hover:border-brand-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 2</span>
              {stats.totalDrafts > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>Submitted ({stats.totalDrafts})</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Next
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Submit Draft or Upload File</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Paste marketing copy or upload `.pdf`, `.docx`, `.png`, or `.jpg` documents for automated pre-publication analysis and WCAG contrast checks.
            </p>
            <button
              onClick={() => nav('review')}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Open Review Studio</span>
            </button>
          </div>

          {/* Step 3 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            stats.approved > 0 
              ? 'bg-emerald-50/40 border-emerald-200/80' 
              : 'bg-slate-50/70 border-slate-200/80 hover:border-brand-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 3</span>
              {stats.approved > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>Approved ({stats.approved})</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Sign-off
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Review Findings & Grant Approval</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Inspect grounded findings, view side-by-side version diffs, and sign off with enforced separation of duties before one-click publishing.
            </p>
            <button
              onClick={() => nav('approvals')}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckSquare2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Open Approval Queue</span>
            </button>
          </div>
        </div>

        {/* Engine Guide Accordion */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowEngineGuide((prev) => !prev)}
            className="flex items-center justify-between w-full text-left text-xs font-bold text-slate-700 hover:text-brand-600 transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand-600" />
              <span>How BrandLens AI Verifies Content (Deterministic vs. AI Grounded vs. Unsupported Claims)</span>
            </span>
            {showEngineGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showEngineGuide && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-3 pt-3 border-t border-slate-100 text-xs animate-in fade-in duration-200">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>100% Deterministic Rules</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Exact lexicon matches and mathematical formulas (banned words, required trademark symbols, WCAG 2.1 color contrast ratios). Zero AI hallucination.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>AI Grounded Verification</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Semantic voice and tone analysis strictly constrained to your brand guidelines. Suggests intent-preserving rewrites without changing factual meaning.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>CLAIM_UNSUPPORTED Flag</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Triggered whenever a sentence makes a quantitative metric claim (e.g., percentages, multipliers, ROI/savings numbers) that lacks an approved citation in your facts library.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          role="button"
          tabIndex={0}
          onClick={() => nav('approvals')}
          onKeyDown={handleCardKeyDown('approvals')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400 group-hover:h-1.5 transition-all" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
            {loading && contents.length === 0 ? (
              <div className="h-9 w-16 bg-slate-200/80 animate-pulse rounded-lg my-1" />
            ) : (
              stats.inReview ?? 0
            )}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-2 flex items-center gap-1">
            <span>Awaiting Reviewer sign-off</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div 
          role="button"
          tabIndex={0}
          onClick={() => nav('review')}
          onKeyDown={handleCardKeyDown('review')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-500 group-hover:h-1.5 transition-all" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active Submissions</span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
            {loading && contents.length === 0 ? (
              <div className="h-9 w-16 bg-slate-200/80 animate-pulse rounded-lg my-1" />
            ) : (
              stats.totalDrafts ?? 0
            )}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-2 flex items-center gap-1">
            <span>Documents in workspace</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform text-slate-400" />
          </div>
        </div>

        <div 
          role="button"
          tabIndex={0}
          onClick={() => nav('audit')}
          onKeyDown={handleCardKeyDown('audit')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 group-hover:h-1.5 transition-all" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Approved for Publish</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2 font-mono">
            {loading && contents.length === 0 ? (
              <div className="h-9 w-16 bg-emerald-100/70 animate-pulse rounded-lg my-1" />
            ) : (
              stats.approved ?? 0
            )}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <span>Locked & compliant copies</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div 
          role="button"
          tabIndex={0}
          onClick={() => nav('knowledge')}
          onKeyDown={handleCardKeyDown('knowledge')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 group-hover:h-1.5 transition-all" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Brand Rules & Facts</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2 font-mono">
            {loading && (stats.guidelinesCount === 0 || stats.guidelinesCount === undefined) ? (
              <div className="h-9 w-16 bg-indigo-100/70 animate-pulse rounded-lg my-1" />
            ) : (
              stats.guidelinesCount ?? 0
            )}
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
            role="button"
            tabIndex={0}
            onClick={() => nav('review')}
            onKeyDown={handleCardKeyDown('review')}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:border-brand-400/80 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
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
            role="button"
            tabIndex={0}
            onClick={() => nav('approvals')}
            onKeyDown={handleCardKeyDown('approvals')}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:border-amber-400/80 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
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
            role="button"
            tabIndex={0}
            onClick={() => nav('knowledge')}
            onKeyDown={handleCardKeyDown('knowledge')}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:border-indigo-400/80 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
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
            role="button"
            tabIndex={0}
            onClick={() => nav('insights')}
            onKeyDown={handleCardKeyDown('insights')}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:border-purple-400/80 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
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
            role="button"
            tabIndex={0}
            onClick={() => nav('audit')}
            onKeyDown={handleCardKeyDown('audit')}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:border-emerald-400/80 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
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
            role="button"
            tabIndex={0}
            onClick={() => nav('settings')}
            onKeyDown={handleCardKeyDown('settings')}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-lg hover:border-slate-400/80 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
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
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-0">
        <div className="p-4 px-6 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Submissions in Workspace ({filteredContents.length})
            </h3>
          </div>
          <button 
            onClick={() => nav('review')}
            className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 transition-colors hover:translate-x-0.5 shrink-0"
          >
            <span>Open Review Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        {contents.length > 0 && (
          <div className="p-3.5 px-6 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search submissions by title, channel, audience..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll no-scrollbar pb-1 sm:pb-0">
              {['ALL', 'IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'DRAFT'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

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
        ) : filteredContents.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs font-semibold text-slate-600">No submissions match your search or filter</p>
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredContents.slice(0, 8).map((item) => {
              const isApproved = item.status === 'APPROVED' || item.status === 'PUBLISHED';
              const isCopied = copiedId === item._id;

              return (
                <div 
                  key={item._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => nav(item.status === 'IN_REVIEW' ? 'approvals' : 'review')}
                  onKeyDown={handleCardKeyDown(item.status === 'IN_REVIEW' ? 'approvals' : 'review')}
                  className="p-3.5 sm:p-4 px-4 sm:px-6 hover:bg-slate-50/80 focus:outline-none focus:bg-brand-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer group"
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
                      <span className="truncate max-w-[200px]">Audience: {item.audience || item.targetAudience || 'General Audience'}</span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="font-mono text-slate-400">v{item.currentVersionNumber || 1}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Copy Approved Copy button */}
                    {isApproved && (
                      <button
                        type="button"
                        onClick={(e) => handleCopyApproved(item, e)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        title="Copy final approved copy to clipboard for publishing"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copy Approved</span>
                          </>
                        )}
                      </button>
                    )}

                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-brand-50 text-slate-400 group-hover:text-brand-600 flex items-center justify-center transition-colors">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
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
