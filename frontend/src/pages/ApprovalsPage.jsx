import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  CheckSquare2, 
  Check, 
  X, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  FileCheck2, 
  User, 
  Calendar, 
  MessageSquare, 
  RefreshCw, 
  Send,
  Rocket,
  Globe,
  GitCompare,
  ArrowRight,
  Edit3,
  ShieldCheck,
  Printer,
  Download,
  FileText,
  Sparkles,
  Copy,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { api } from '../services/api';
import { DiffViewer } from '../components/common/DiffViewer';
import { ModalPortal } from '../components/common/ModalPortal';
import {
  buildCertificatePayload,
  downloadCertificateJson,
  downloadCertificateMarkdown,
  printCertificatePdf,
} from '../utils/certificate';

export function ApprovalsPage({ isActive = true }) {
  const { user, token, activeOrg, activeRole } = useAuth();
  const [contents, setContents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [latestReview, setLatestReview] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Decision state
  const [decisionReason, setDecisionReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Versions, Diff & Safe Publishing
  const [versions, setVersions] = useState([]);
  const [showDiff, setShowDiff] = useState(false);
  const [approvalDiffBaseId, setApprovalDiffBaseId] = useState('');
  const [approvalDiffTargetId, setApprovalDiffTargetId] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishDestination, setPublishDestination] = useState('Website CMS');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [copiedApproved, setCopiedApproved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleCopyApprovedText = async () => {
    try {
      const textToCopy = selectedContent?.currentVersionId?.text || (versions.length > 0 ? versions[versions.length - 1]?.text : '') || '';
      if (!textToCopy) return;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedApproved(true);
      setTimeout(() => setCopiedApproved(false), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const filteredContents = useMemo(() => {
    return contents.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const channelMatch = (item.channel || '').toLowerCase().includes(q);
        const audienceMatch = (item.audience || '').toLowerCase().includes(q);
        return titleMatch || channelMatch || audienceMatch;
      }
      return true;
    });
  }, [contents, statusFilter, searchQuery]);

  // Sync version comparison selection
  useEffect(() => {
    if (versions.length > 0) {
      if (!approvalDiffBaseId || !versions.some((v) => v._id === approvalDiffBaseId)) {
        setApprovalDiffBaseId(versions[0]._id);
      }
      if (!approvalDiffTargetId || !versions.some((v) => v._id === approvalDiffTargetId)) {
        setApprovalDiffTargetId(versions[versions.length - 1]._id);
      }
    }
  }, [versions, approvalDiffBaseId, approvalDiffTargetId]);

  const canApprove = activeRole === 'ADMIN' || activeRole === 'MANAGER';
  const isCreatorOfDraft = Boolean(
    selectedContent?.createdBy && (
      String(selectedContent.createdBy?._id || selectedContent.createdBy) === String(user?._id)
    )
  );

  const activeWorkspaceId = activeOrg?._id || activeOrg?.id;

  const loadData = useCallback(async (isBackground = false) => {
    if (!activeWorkspaceId || !token) return;
    if (isBackground) {
      setBackgroundRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await api.getContents(activeWorkspaceId, token);
      const all = data.contents || [];
      setContents(all);

      const inReviewFirst = all.find((c) => c.status === 'IN_REVIEW') || all[0] || null;
      setSelectedId((prev) => {
        if (prev && all.some((c) => c._id === prev)) return prev;
        return inReviewFirst ? inReviewFirst._id : null;
      });
      if (all.length === 0) {
        setSelectedContent(null);
        setLatestReview(null);
        setVersions([]);
        setComments([]);
      }
    } catch (err) {
      if (!isBackground) setError(err.message);
    } finally {
      if (isBackground) {
        setBackgroundRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [activeWorkspaceId, token]);

  // Auto-fetch approval queue on mount, when activeWorkspaceId changes, or when user navigates to #approvals
  useEffect(() => {
    if (isActive && activeWorkspaceId && token) {
      const isBg = contents.length > 0;
      loadData(isBg);
    }
  }, [isActive, activeWorkspaceId, token, loadData]);

  // Also listen for URL hash changes to #approvals
  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== 'undefined' && window.location.hash.toLowerCase().includes('approvals')) {
        const isBg = contents.length > 0;
        loadData(isBg);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [loadData, contents.length]);

  // Esc key listener to close modal without page refresh
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showPublishModal) setShowPublishModal(false);
        if (showCertificateModal) setShowCertificateModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPublishModal, showCertificateModal]);

  const loadDetails = useCallback(async (cId) => {
    if (!activeOrg?._id || !token || !cId) return;
    try {
      const [cData, cmData] = await Promise.all([
        api.getContent(activeOrg._id, cId, token),
        api.getComments(activeOrg._id, cId, token),
      ]);
      setSelectedContent(cData.content);
      setLatestReview(cData.latestReview);
      setVersions(cData.versions || []);
      setComments(cmData.comments || []);
    } catch (err) {
      setError(err.message);
    }
  }, [activeOrg, token]);

  const handlePublish = async () => {
    if (!selectedId || !activeOrg?._id || !token) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await api.publishContent(
        activeOrg._id,
        selectedId,
        { destination: publishDestination },
        token
      );
      setSuccessMsg(`🚀 Successfully published to ${publishDestination} with Certificate ${res.certificateId}!`);
      setShowPublishModal(false);
      await loadDetails(selectedId);
      await loadData();
    } catch (err) {
      setError(err.message || 'Publishing failed');
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      loadDetails(selectedId);
    }
  }, [selectedId, loadDetails]);

  const handleDecision = async (decision) => {
    if (!selectedId || !activeOrg?._id || !token) return;
    setSubmittingDecision(true);
    setError(null);
    try {
      await api.submitApprovalDecision(
        activeOrg._id,
        selectedId,
        { decision, reason: decisionReason },
        token
      );
      setSuccessMsg(`Content officially updated to ${decision}!`);
      setDecisionReason('');
      await loadDetails(selectedId);
      await loadData();
    } catch (err) {
      setError(err.message || 'Decision failed');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedId || !activeOrg?._id || !token) return;
    try {
      await api.addComment(activeOrg._id, selectedId, { body: commentInput }, token);
      setCommentInput('');
      const cmData = await api.getComments(activeOrg._id, selectedId, token);
      setComments(cmData?.comments || []);
    } catch (err) {
      setError(err.message || 'Comment failed');
    }
  };

  const pendingQueue = contents.filter((c) => c.status === 'IN_REVIEW');
  const otherItems = contents.filter((c) => c.status !== 'IN_REVIEW');

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Formal Approval Queue</span>
            <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Governance Gate
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorized human sign-off, change requests, policy overrides, and tamper-evident publication locking.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            title="Reload queue"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
          <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5 border ${
            pendingQueue.length > 0 
              ? 'bg-gradient-to-r from-amber-50 to-amber-100/70 text-amber-800 border-amber-200' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pendingQueue.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span>{pendingQueue.length > 0 ? `${pendingQueue.length} Awaiting Sign-off` : 'All Caught Up'}</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="truncate sm:whitespace-normal">{error}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setError(null);
                loadData();
                if (selectedId) loadDetails(selectedId);
              }}
              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 font-semibold text-xs">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800 font-semibold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Approval Queue Layout */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${selectedContent ? 'items-start' : 'items-stretch'}`}>
        {/* Left: Queue Items List (4 cols) */}
        <div className={`lg:col-span-4 flex flex-col ${selectedContent ? 'lg:sticky lg:top-6' : ''}`}>
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex-1 flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap">
                  Review Queue
                </h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 shrink-0">
                  {filteredContents.length} of {contents.length}
                </span>
              </div>
              {pendingQueue.length > 0 && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 shrink-0">
                  {pendingQueue.length} pending
                </span>
              )}
            </div>

            {/* Queue Search & Status Filter */}
            {contents.length > 0 && (
              <div className="space-y-2 pb-1 border-b border-slate-100">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search queue by title, channel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/70 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll no-scrollbar py-1">
                  {['ALL', 'IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'DRAFT'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
                        statusFilter === st
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {st === 'ALL'
                        ? 'All'
                        : st === 'CHANGES_REQUESTED'
                        ? 'Changes Requested'
                        : st === 'IN_REVIEW'
                        ? 'In Review'
                        : st === 'APPROVED'
                        ? 'Approved'
                        : 'Draft'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[280px] lg:max-h-[560px] overflow-y-auto touch-scroll pr-0.5">
              {contents.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mx-auto">
                    <CheckSquare2 className="w-5 h-5 text-slate-300 stroke-[1.8]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">Review Queue is Empty</p>
                    <p className="text-[11px] text-slate-400 max-w-[210px] mx-auto leading-relaxed">
                      No submissions currently awaiting review sign-off.
                    </p>
                  </div>
                  <a
                    href="#review"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                  >
                    <span>Open Review Studio</span>
                  </a>
                </div>
              ) : filteredContents.length === 0 ? (
                <div className="py-8 px-2 text-center space-y-1.5">
                  <p className="text-xs font-semibold text-slate-600">No submissions found</p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                    className="text-xs font-bold text-brand-600 hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredContents.map((item) => {
                  const isSelected = item._id === selectedId;
                  const isInReview = item.status === 'IN_REVIEW';
                  const isApproved = item.status === 'APPROVED';

                  return (
                    <button
                      key={item._id}
                      onClick={() => setSelectedId(item._id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 relative ${
                        isSelected
                          ? 'border-brand-500 bg-gradient-to-r from-brand-50/80 to-indigo-50/30 shadow-xs ring-1 ring-brand-500/20'
                          : 'border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="mb-2">
                        <span className="font-bold text-slate-900 text-xs block truncate" title={item.title}>
                          {item.title}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{item.channel}</span>
                          <span className="text-slate-300">&middot;</span>
                          <span className="font-mono text-slate-400 shrink-0">v{item.currentVersionNumber || 1}</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isInReview
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Inspection & Approval Sign-off Box (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-5">
          {selectedContent ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
              {/* Submission Details Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-base">{selectedContent.title}</h3>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold shrink-0">
                      v{selectedContent.currentVersionNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="whitespace-nowrap">Submitted By: <strong className="text-slate-700">{selectedContent.createdBy?.name || 'Creator'}</strong></span>
                    <span className="whitespace-nowrap">Channel: <strong className="text-slate-700">{selectedContent.channel}</strong></span>
                    <span className="whitespace-nowrap">Audience: <strong className="text-slate-700">{selectedContent.audience}</strong></span>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border self-start shrink-0 whitespace-nowrap ${
                  selectedContent.status === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : selectedContent.status === 'IN_REVIEW'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {selectedContent.status}
                </div>
              </div>

              {/* Reviewed Text Preview & Visual Diff */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Submitted Content Body (Version {selectedContent.currentVersionNumber})
                  </label>
                  <div className="flex items-center gap-2">
                    {(selectedContent.status === 'APPROVED' || selectedContent.status === 'PUBLISHED') && (
                      <button
                        type="button"
                        onClick={handleCopyApprovedText}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        title="Copy final approved copy to clipboard for LinkedIn, email, or CMS"
                      >
                        {copiedApproved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-600" />}
                        <span>{copiedApproved ? 'Copied!' : 'Copy Approved Copy'}</span>
                      </button>
                    )}
                    {versions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setShowDiff((prev) => !prev)}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg hover:bg-brand-50"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        <span>{showDiff ? 'Hide Version Diff' : 'Compare Version Diffs'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {showDiff && versions.length > 1 ? (() => {
                  const baseV = versions.find((v) => v._id === approvalDiffBaseId) || versions[0] || null;
                  const targetV = versions.find((v) => v._id === approvalDiffTargetId) || versions[versions.length - 1] || null;
                  const oldText = baseV?.text || '';
                  const newText = targetV?.text || '';
                  const oldLabel = baseV ? `Base v${baseV.versionNumber} (${baseV.changeSummary || 'Original Draft'})` : 'Base Draft';
                  const newLabel = targetV ? `Target v${targetV.versionNumber} (${targetV.changeSummary || 'Revision'})` : 'Target Revision';

                  return (
                    <div className="mb-3 animate-in fade-in duration-200 space-y-2.5">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-700">Base Version:</span>
                          <select
                            value={approvalDiffBaseId || (versions[0]?._id || '')}
                            onChange={(e) => setApprovalDiffBaseId(e.target.value)}
                            className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                          >
                            {versions.map((v) => (
                              <option key={v._id} value={v._id}>
                                v{v.versionNumber} ({v.changeSummary || `Version ${v.versionNumber}`})
                              </option>
                            ))}
                          </select>

                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                          <span className="font-bold text-slate-700">Compare With:</span>
                          <select
                            value={approvalDiffTargetId || (versions[versions.length - 1]?._id || '')}
                            onChange={(e) => setApprovalDiffTargetId(e.target.value)}
                            className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                          >
                            {versions.map((v) => (
                              <option key={v._id} value={v._id}>
                                v{v.versionNumber} ({v.changeSummary || `Version ${v.versionNumber}`})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          Toggle <strong>Side-by-Side</strong> vs <strong>Unified</strong> mode inside toolbar below
                        </div>
                      </div>

                      <DiffViewer
                        oldText={oldText}
                        newText={newText}
                        oldLabel={oldLabel}
                        newLabel={newLabel}
                      />
                    </div>
                  );
                })() : (
                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-sans shadow-inner">
                    {selectedContent.currentVersionId?.text || 'No text content available'}
                  </div>
                )}
              </div>

              {/* Findings Summary for Reviewer */}
              <div className="p-4.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-brand-600" />
                    Review Findings Checklist ({latestReview?.findings?.length || 0})
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono font-medium">
                    {latestReview?.processingMetadata?.executionTimeMs || 0}ms check time
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  {latestReview?.findings?.map((f) => (
                    <div key={f._id} className="flex items-start justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                      <div className="min-w-0 flex-1 leading-relaxed">
                        <span className="font-bold text-slate-800">[{f.type}]</span> {f.explanation}
                        {f.reviewStatus === 'OVERRIDDEN' && (
                          <div className="mt-1 text-[11px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 w-fit">
                            Overridden: "{f.overrideReason}"
                          </div>
                        )}
                        {f.reviewStatus === 'EDITED' && (
                          <div className="mt-1 text-[11px] text-indigo-800 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 w-fit">
                            Custom Edited: "{f.editedText}"
                          </div>
                        )}
                        {f.reviewStatus === 'REJECTED' && (
                          <div className="mt-1 text-[11px] text-rose-800 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 w-fit">
                            Declined: "{f.rejectionReason}"
                          </div>
                        )}
                      </div>
                      <span className={`mt-0.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 border ${
                        f.reviewStatus === 'ACCEPTED' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : f.reviewStatus === 'EDITED'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : f.reviewStatus === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : f.reviewStatus === 'OVERRIDDEN'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {f.reviewStatus || 'PENDING'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manager Approval Controls */}
              {canApprove && selectedContent.status !== 'APPROVED' && selectedContent.status !== 'PUBLISHED' ? (
                <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950 text-white rounded-2xl shadow-lg border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-400/30">
                        <CheckSquare2 className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">Manager Sign-off & Release Decision</h4>
                        <p className="text-[11px] text-slate-400">Human governance authority gate before release</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/30 hidden sm:inline-block">
                      RBAC VERIFIED
                    </span>
                  </div>

                  {isCreatorOfDraft && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300">Separation of Duties Active: </span>
                        You authored this draft (v{selectedContent.currentVersionNumber}). Enterprise governance strictly prohibits authors from approving their own submissions. Sign in with an independent Manager or Admin account to approve this submission.
                      </div>
                    </div>
                  )}

                  <div>
                    <input
                      type="text"
                      placeholder="Decision notes (e.g. Verified claims against published SLA whitepaper)..."
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-800/90 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-400 transition-all"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      disabled={submittingDecision || isCreatorOfDraft}
                      onClick={() => handleDecision('APPROVED')}
                      title={isCreatorOfDraft ? "Separation of duties: Creators cannot approve their own draft" : "Approve and lock version"}
                      className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Approve Publication (Lock Version)</span>
                    </button>
                    <button
                      type="button"
                      disabled={submittingDecision}
                      onClick={() => handleDecision('CHANGES_REQUESTED')}
                      className="w-full sm:w-auto py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-98 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Request Changes</span>
                    </button>
                    <button
                      type="button"
                      disabled={submittingDecision}
                      onClick={() => handleDecision('REJECTED')}
                      className="w-full sm:w-auto py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ) : selectedContent.status === 'APPROVED' ? (
                <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50/60 border border-emerald-200/90 rounded-2xl text-xs text-emerald-900 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-emerald-950 font-bold block text-sm">Pre-Publication Sign-off Granted</strong>
                        <span className="text-emerald-700">
                          Approved by <strong>{selectedContent.approvedBy?.name || 'Authorized Manager'}</strong>
                          {selectedContent.approvedAt ? ` on ${new Date(selectedContent.approvedAt).toLocaleString()}` : ''}. Version locked.
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-emerald-200/70 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Compliance Verification Passed
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyApprovedText}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Copy locked, compliant copy directly to clipboard"
                      >
                        {copiedApproved ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedApproved ? 'Copied to Clipboard!' : 'Copy Approved Copy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCertificateModal(true)}
                        className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View &amp; Export Certificate</span>
                      </button>
                      {canApprove && (
                        <button
                          type="button"
                          onClick={() => setShowPublishModal(true)}
                          className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/25 transition-all hover:scale-[1.02] active:scale-98 flex items-center gap-2"
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          <span>Publish to Production Channel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : selectedContent.status === 'PUBLISHED' ? (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Rocket className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                      <strong>Live &amp; Published:</strong> This content has been published to production. Immutable audit trail recorded.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyApprovedText}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Copy approved published copy"
                    >
                      {copiedApproved ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedApproved ? 'Copied!' : 'Copy Approved Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCertificateModal(true)}
                      className="px-3 py-1.5 bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Export Certificate</span>
                    </button>
                    <span className="px-2 py-1 rounded bg-purple-200 text-purple-800 font-mono font-bold text-[10px]">
                      LIVE IN PRODUCTION
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                  Only authorized Managers and Admins can formally approve or reject publication requests.
                </div>
              )}

              {/* Collaboration Comments */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  Review Discussion Thread ({comments.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {comments.map((cm) => (
                    <div key={cm._id} className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <strong>{cm.authorId?.name || 'Reviewer'}</strong>
                        <span>{new Date(cm.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-800">{cm.body}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add comment for creator or reviewer..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button type="submit" className="px-3.5 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold">
                    Post
                  </button>
                </form>
              </div>
            </div>
          ) : contents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-3 shadow-xs flex-1 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 mx-auto">
                <CheckSquare2 className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Submissions in Approval Queue</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                All submitted brand drafts have been reviewed and approved, or no content has been submitted for sign-off yet. Create or evaluate drafts in the <strong className="text-slate-600">Compliance Review</strong> studio to populate this queue.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-2 shadow-xs text-slate-400 text-xs flex-1 flex flex-col items-center justify-center">
              <p className="font-semibold text-slate-600">Select a submission from the queue</p>
              <p className="text-[11px]">Click any item on the left to inspect rule findings and issue manager sign-off.</p>
            </div>
          )}
        </div>
      </div>
      {/* Safe One-Click Publishing Modal */}
      {showPublishModal && (
        <ModalPortal isOpen={showPublishModal} onClose={() => setShowPublishModal(false)}>
          <div 
            onClick={() => setShowPublishModal(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto my-auto animate-in fade-in zoom-in-95 duration-200"
            >
            <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Publish to Live Production</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowPublishModal(false)} 
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Close modal (Esc)"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pre-Publication Certificate Verified
                </div>
                <div className="text-[11px] text-emerald-700">
                  Document "{selectedContent?.title}" has passed all deterministic terminology checks and received formal human approval.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Destination Channel:
                </label>
                <select
                  value={publishDestination}
                  onChange={(e) => setPublishDestination(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  <option value="Website CMS">Website CMS (Production CDN)</option>
                  <option value="LinkedIn Corporate">LinkedIn Corporate Page</option>
                  <option value="Twitter/X Brand Handle">Twitter/X Brand Handle</option>
                  <option value="Corporate Slack Announcement">Corporate Slack Announcement</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={publishing}
                  onClick={handlePublish}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>{publishing ? 'Publishing...' : `Confirm & Publish to ${publishDestination}`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
      )}

      {/* Pre-Publication Compliance Certificate Modal */}
      {showCertificateModal && selectedContent && (() => {
        const cert = buildCertificatePayload(selectedContent, latestReview, activeOrg, user);
        if (!cert) return null;

        return (
          <ModalPortal isOpen={showCertificateModal} onClose={() => setShowCertificateModal(false)}>
            <div
              onClick={() => setShowCertificateModal(false)}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm overflow-y-auto"
              role="dialog"
              aria-modal="true"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200"
              >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30 text-emerald-300">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Pre-Publication Compliance Certificate</h3>
                    <p className="text-xs text-brand-200/80">Exportable tamper-evident proof of governance</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCertificateModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Close modal (Esc)"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                <div className="border-2 border-brand-900/20 rounded-2xl p-6 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/70 space-y-5 shadow-sm relative overflow-hidden">
                  {/* Decorative Corner Watermark */}
                  <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full border-4 border-emerald-500/10 flex items-center justify-center pointer-events-none">
                    <ShieldCheck className="w-24 h-24 text-emerald-500/10" />
                  </div>

                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200/80">
                          Official Sign-Off Clearance
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-semibold">
                          {cert.certificateId}
                        </span>
                      </div>
                      <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">{cert.content.title}</h4>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>Workspace: <strong className="text-slate-800">{cert.organisation.name}</strong></span>
                        <span>&bull;</span>
                        <span>Version: <strong className="text-slate-800 font-mono">v{cert.content.versionNumber}</strong></span>
                        <span>&bull;</span>
                        <span>Version ID: <strong className="text-slate-700 font-mono text-[11px]">{cert.content.versionId.slice(-8)}</strong></span>
                        <span>&bull;</span>
                        <span>Channel: <strong className="text-slate-800">{cert.content.channel}</strong></span>
                      </div>
                    </div>

                    <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-full text-xs font-bold uppercase self-start sm:self-auto shrink-0 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{cert.content.status}</span>
                    </div>
                  </div>

                  {/* Approver & Separation of Duties */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Authorized Sign-off By</span>
                      <span className="font-bold text-slate-900 block text-sm">{cert.approval.approverName}</span>
                      <span className="text-slate-500 text-[11px] block">{new Date(cert.approval.approvedAt).toLocaleString()}</span>
                      {cert.approval.approvalNotes && (
                        <span className="text-slate-600 text-[11px] italic block mt-1">"{cert.approval.approvalNotes}"</span>
                      )}
                    </div>

                    <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Author &amp; Separation of Duties</span>
                      <span className="font-bold text-slate-900 block text-sm">Authored by: {cert.content.authorName}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {cert.approval.separationOfDutiesVerified ? 'Independent Sign-off Verified' : 'Governance Audited'}
                      </span>
                    </div>
                  </div>

                  {/* Findings Summary */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Findings Summary</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="font-mono font-bold text-base text-slate-800">{cert.findingsSummary.totalChecksAnalyzed}</div>
                        <div className="text-[10px] text-slate-500">Checks Evaluated</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="font-mono font-bold text-base text-emerald-600">{cert.findingsSummary.acceptedFixes}</div>
                        <div className="text-[10px] text-slate-500">Fixes Accepted</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="font-mono font-bold text-base text-indigo-600">{cert.findingsSummary.customEditedFixes}</div>
                        <div className="text-[10px] text-slate-500">Custom Edited</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="font-mono font-bold text-base text-amber-600">{cert.findingsSummary.justifiedOverrides}</div>
                        <div className="text-[10px] text-slate-500">Justified Overrides</div>
                      </div>
                    </div>
                  </div>

                  {/* AI vs Deterministic Check Disclosure */}
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2 text-xs">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>AI vs. Deterministic Check Methodology Disclosure</span>
                    </div>
                    <div className="text-[11px] text-blue-950/85 space-y-1.5 leading-relaxed">
                      <div>
                        <strong>Deterministic Engine ({cert.findingsSummary.deterministicChecksCount} checks): </strong>
                        {cert.methodologyDisclosure.deterministicEngine.scope}. <em>{cert.methodologyDisclosure.deterministicEngine.guarantee}</em>
                      </div>
                      <div>
                        <strong>AI-Assisted Grounded Engine ({cert.findingsSummary.aiEvaluatedChecksCount} checks): </strong>
                        {cert.methodologyDisclosure.aiEvaluationEngine.scope}. <em>{cert.methodologyDisclosure.aiEvaluationEngine.safeguard}</em>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Hash: {cert.verificationHash}</span>
                    <span>{cert.governanceEngine}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer with Export Actions */}
              <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printCertificatePdf(cert)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadCertificateMarkdown(cert)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download Markdown (.md)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCertificateModal(false)}
                    className="px-3.5 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadCertificateJson(cert)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON (.json)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
        );
      })()}
    </div>
  );
}
