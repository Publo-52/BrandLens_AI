import React, { useState, useEffect, useCallback } from 'react';
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
  GitCompare 
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { api } from '../services/api';
import { DiffViewer } from '../components/common/DiffViewer';

export function ApprovalsPage() {
  const { user, token, activeOrg, activeRole } = useAuth();
  const [contents, setContents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [latestReview, setLatestReview] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Decision state
  const [decisionReason, setDecisionReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Versions, Diff & Safe Publishing
  const [versions, setVersions] = useState([]);
  const [showDiff, setShowDiff] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishDestination, setPublishDestination] = useState('Website CMS');
  const [showPublishModal, setShowPublishModal] = useState(false);

  const canApprove = activeRole === 'ADMIN' || activeRole === 'MANAGER';

  const loadData = useCallback(async () => {
    if (!activeOrg?._id || !token) return;
    setLoading(true);
    try {
      const data = await api.getContents(activeOrg._id, token);
      const all = data.contents || [];
      setContents(all);

      const inReviewFirst = all.find((c) => c.status === 'IN_REVIEW') || all[0];
      if (inReviewFirst) {
        setSelectedId((prev) => prev || inReviewFirst._id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeOrg, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
          <span className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-amber-50 to-amber-100/70 text-amber-800 border border-amber-200 rounded-full shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>{pendingQueue.length} Awaiting Sign-off</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 font-semibold text-xs">
            Dismiss
          </button>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Queue Items List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Submissions in Review Queue
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {contents.map((item) => {
                const isSelected = item._id === selectedId;
                const isInReview = item.status === 'IN_REVIEW';
                const isApproved = item.status === 'APPROVED';

                return (
                  <button
                    key={item._id}
                    onClick={() => setSelectedId(item._id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-slate-900 text-xs truncate max-w-[170px]">
                        {item.title}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInReview
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>{item.channel}</span>
                      <span>v{item.currentVersionNumber || 1}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Inspection & Approval Sign-off Box (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedContent ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Submission Details Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{selectedContent.title}</h3>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      v{selectedContent.currentVersionNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span>Submitted By: <strong>{selectedContent.createdBy?.name || 'Creator'}</strong></span>
                    <span>Channel: <strong>{selectedContent.channel}</strong></span>
                    <span>Audience: <strong>{selectedContent.audience}</strong></span>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                    Submitted Content Body (Version {selectedContent.currentVersionNumber})
                  </label>
                  {versions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setShowDiff((prev) => !prev)}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>{showDiff ? 'Hide Version Diff' : 'Compare with v1 Diff'}</span>
                    </button>
                  )}
                </div>

                {showDiff && versions.length > 1 ? (
                  <div className="mb-3 animate-in fade-in duration-200">
                    <DiffViewer
                      oldText={versions[0]?.text || ''}
                      newText={selectedContent.currentVersionId?.text || versions[versions.length - 1]?.text || ''}
                      oldLabel="Base Draft (v1)"
                      newLabel={`Revision (v${selectedContent.currentVersionNumber})`}
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
                    {selectedContent.currentVersionId?.text || 'No text content available'}
                  </div>
                )}
              </div>

              {/* Findings Summary for Reviewer */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-brand-600" />
                    Review Findings Checklist ({latestReview?.findings?.length || 0})
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Execution Time: {latestReview?.processingMetadata?.executionTimeMs || 0}ms
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  {latestReview?.findings?.map((f) => (
                    <div key={f._id} className="flex items-start justify-between gap-2 p-2 bg-white rounded border border-slate-100">
                      <div>
                        <span className="font-semibold text-slate-800">[{f.type}]</span> {f.explanation}
                        {f.reviewStatus === 'OVERRIDDEN' && (
                          <span className="ml-2 text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Overridden: "{f.overrideReason}"
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        f.reviewStatus === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {f.reviewStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manager Approval Controls */}
              {canApprove && selectedContent.status !== 'APPROVED' ? (
                <div className="p-5 bg-gradient-to-r from-slate-900 to-brand-950 text-white rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare2 className="w-5 h-5 text-brand-400" />
                    <h4 className="font-bold text-sm">Manager Sign-off & Release Decision</h4>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Decision notes (e.g. Verified claims against published SLA whitepaper)..."
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-400"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={submittingDecision}
                      onClick={() => handleDecision('APPROVED')}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Publication (Lock Version)</span>
                    </button>
                    <button
                      type="button"
                      disabled={submittingDecision}
                      onClick={() => handleDecision('CHANGES_REQUESTED')}
                      className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Request Changes</span>
                    </button>
                    <button
                      type="button"
                      disabled={submittingDecision}
                      onClick={() => handleDecision('REJECTED')}
                      className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ) : selectedContent.status === 'APPROVED' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-3">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <strong>Official Pre-Publication Sign-off Granted:</strong> This content is officially approved and locked. Compliant for publication.
                    </div>
                  </div>
                  {canApprove && (
                    <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-emerald-700 font-medium">Pre-Publication Compliance Verified</span>
                      <button
                        type="button"
                        onClick={() => setShowPublishModal(true)}
                        className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        <span>Publish to Production Channel</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : selectedContent.status === 'PUBLISHED' ? (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                      <strong>Live & Published:</strong> This content has been published to production. Immutable audit trail recorded.
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-800 font-mono font-bold text-[10px]">
                    LIVE IN PRODUCTION
                  </span>
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
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Select a submission from the queue to inspect.
            </div>
          )}
        </div>
      </div>
      {/* Safe One-Click Publishing Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Publish to Live Production</h3>
              </div>
              <button onClick={() => setShowPublishModal(false)} className="text-slate-300 hover:text-white p-1">
                <X className="w-4 h-4" />
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
      )}
    </div>
  );
}
