import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileCheck2, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  HelpCircle, 
  Check, 
  X, 
  Send, 
  History, 
  MessageSquare, 
  Lock, 
  ArrowRight, 
  RefreshCw, 
  Share2,
  GitCompare 
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { api } from '../services/api';
import { DiffViewer } from '../components/common/DiffViewer';

const SAMPLE_DEMO_DRAFT = `Experience Nova Cloud today! We guarantee a 100% risk-free platform with automated scheduled backups across regions.`;

export function ReviewPage() {
  const { user, token, activeOrg, activeRole } = useAuth();
  const [contents, setContents] = useState([]);
  const [selectedContentId, setSelectedContentId] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [latestReview, setLatestReview] = useState(null);
  const [versions, setVersions] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Submission Form Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newChannel, setNewChannel] = useState('Social Media');
  const [newAudience, setNewAudience] = useState('Enterprise Customers');
  const [newText, setNewText] = useState('');

  // Editing / Version Revision in workspace
  const [workingText, setWorkingText] = useState('');
  const [revisionSummary, setRevisionSummary] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  // Overrides / Comments
  const [commentInput, setCommentInput] = useState('');
  const [overrideModalFinding, setOverrideModalFinding] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalFinding, setRejectModalFinding] = useState(null);

  const loadContents = useCallback(async () => {
    if (!activeOrg?._id || !token) return;
    setLoading(true);
    try {
      const data = await api.getContents(activeOrg._id, token);
      setContents(data.contents || []);
      if (!selectedContentId && data.contents && data.contents.length > 0) {
        setSelectedContentId(data.contents[0]._id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeOrg, token, selectedContentId]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  // Load single content details & review findings
  const loadContentDetails = useCallback(async (cId) => {
    if (!activeOrg?._id || !token || !cId) return;
    try {
      const [cData, cmData] = await Promise.all([
        api.getContent(activeOrg._id, cId, token),
        api.getComments(activeOrg._id, cId, token),
      ]);
      setSelectedContent(cData.content);
      setVersions(cData.versions || []);
      setLatestReview(cData.latestReview);
      setComments(cmData.comments || []);
      setWorkingText(cData.content?.currentVersionId?.text || cData.versions?.[cData.versions.length - 1]?.text || '');
    } catch (err) {
      setError(err.message);
    }
  }, [activeOrg, token]);

  useEffect(() => {
    if (selectedContentId) {
      loadContentDetails(selectedContentId);
    }
  }, [selectedContentId, loadContentDetails]);

  const handleCreateSubmission = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;

    if (!activeOrg?._id || !token) {
      setError('Please sign in or select an organisation workspace before submitting draft content.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.createContent(
        activeOrg._id,
        { title: newTitle, channel: newChannel, audience: newAudience, text: newText },
        token
      );
      setSuccessMsg('Content submitted and automated review completed!');
      setShowNewModal(false);
      setNewTitle('');
      setNewText('');
      if (res?.content?._id) {
        setSelectedContentId(res.content._id);
        await loadContents();
        await loadContentDetails(res.content._id);
      } else {
        await loadContents();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit draft content');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFix = (original, suggestion) => {
    if (!suggestion) return;
    setWorkingText((prev) => (prev ? prev.replace(original, suggestion) : suggestion));
    setSuccessMsg(`Applied fix: "${suggestion}"`);
  };

  const handleSubmitRevision = async (e) => {
    e.preventDefault();
    if (!workingText.trim() || !selectedContentId || !activeOrg?._id || !token) {
      if (!activeOrg?._id || !token) setError('Please sign in to submit revisions.');
      return;
    }
    setSubmittingRevision(true);
    setError(null);
    try {
      await api.submitNewVersion(
        activeOrg._id,
        selectedContentId,
        { text: workingText, changeSummary: revisionSummary || 'Applied brand governance corrections' },
        token
      );
      setSuccessMsg('New version created and re-reviewed successfully!');
      setRevisionSummary('');
      await loadContentDetails(selectedContentId);
      await loadContents();
    } catch (err) {
      setError(err.message || 'Failed to submit revision');
    } finally {
      setSubmittingRevision(false);
    }
  };

  const handleOverrideFinding = async () => {
    if (!overrideModalFinding || !overrideReason.trim() || !activeOrg?._id || !token) return;
    try {
      await api.updateFindingDecision(
        activeOrg._id,
        selectedContentId,
        overrideModalFinding._id,
        { reviewStatus: 'OVERRIDDEN', overrideReason },
        token
      );
      setSuccessMsg('Reviewer override recorded with justified reason in audit log.');
      setOverrideModalFinding(null);
      setOverrideReason('');
      await loadContentDetails(selectedContentId);
    } catch (err) {
      setError(err.message || 'Failed to record override');
    }
  };

  const handleRejectFinding = async () => {
    if (!rejectModalFinding || !rejectReason.trim() || !activeOrg?._id || !token) return;
    try {
      await api.updateFindingDecision(
        activeOrg._id,
        selectedContentId,
        rejectModalFinding._id,
        { reviewStatus: 'REJECTED', rejectionReason: rejectReason },
        token
      );
      setSuccessMsg('Suggestion rejected with recorded rationale.');
      setRejectModalFinding(null);
      setRejectReason('');
      await loadContentDetails(selectedContentId);
    } catch (err) {
      setError(err.message || 'Failed to record rejection');
    }
  };

  const handleRequestApproval = async () => {
    if (!selectedContentId || !activeOrg?._id || !token) return;
    try {
      await api.requestApproval(activeOrg._id, selectedContentId, token);
      setSuccessMsg('Routed to formal approval queue (IN_REVIEW).');
      await loadContentDetails(selectedContentId);
      await loadContents();
    } catch (err) {
      setError(err.message || 'Approval request failed');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedContentId || !activeOrg?._id || !token) return;
    try {
      await api.addComment(activeOrg._id, selectedContentId, { body: commentInput }, token);
      setCommentInput('');
      const cmData = await api.getComments(activeOrg._id, selectedContentId, token);
      setComments(cmData?.comments || []);
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    }
  };

  const isApproved = selectedContent?.status === 'APPROVED';

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Content Review Workspace</h2>
          <p className="text-xs text-slate-500">
            Submit drafts, inspect source-cited findings, apply intent-preserving fixes, and route to approval.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setNewTitle('NovaTech Cloud Launch Campaign');
              setNewChannel('Social Media');
              setNewAudience('Enterprise Decision Makers');
              setNewText(SAMPLE_DEMO_DRAFT);
              setShowNewModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Test Demo Draft</span>
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Submission</span>
          </button>
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

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Submissions List & Active Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Submissions Switcher Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-400 shrink-0 px-2 uppercase tracking-wider text-[10px]">
              Submissions:
            </span>
            {contents.map((c) => {
              const isSelected = c._id === selectedContentId;
              return (
                <button
                  key={c._id}
                  onClick={() => setSelectedContentId(c._id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors flex items-center gap-2 ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span className="truncate max-w-[130px]">{c.title}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                    c.status === 'APPROVED' ? 'bg-emerald-500 text-white' : 'bg-black/10'
                  }`}>
                    v{c.currentVersionNumber || 1}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedContent && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              {/* Submission Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{selectedContent.title}</h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      selectedContent.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedContent.status === 'IN_REVIEW'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {selectedContent.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span>Channel: <strong>{selectedContent.channel}</strong></span>
                    <span>Audience: <strong>{selectedContent.audience}</strong></span>
                    <span>Version: <strong>v{selectedContent.currentVersionNumber}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                {!isApproved ? (
                  <button
                    onClick={handleRequestApproval}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors self-start sm:self-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Request Sign-off</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked & Approved</span>
                  </div>
                )}
              </div>

              {/* Version History Tabs & Visual Diff Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 text-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <History className="w-3.5 h-3.5" /> Versions:
                  </span>
                  {versions.map((v) => (
                    <button
                      key={v._id}
                      onClick={() => setWorkingText(v.text)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-brand-50 border border-slate-200 rounded text-slate-700 hover:text-brand-700 font-mono transition-colors"
                    >
                      v{v.versionNumber} ({v.changeSummary})
                    </button>
                  ))}
                </div>

                {versions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowDiff((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      showDiff 
                        ? 'bg-brand-600 text-white border-brand-700 shadow-sm' 
                        : 'bg-white hover:bg-brand-50 text-slate-700 hover:text-brand-700 border-slate-300'
                    }`}
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>{showDiff ? 'Hide Visual Diff' : 'Compare Visual Diff'}</span>
                  </button>
                )}
              </div>

              {/* Visual Diff Viewer */}
              {showDiff && (
                <div className="my-2 animate-in fade-in duration-200">
                  <DiffViewer
                    oldText={versions[0]?.text || ''}
                    newText={workingText}
                    oldLabel="Base Version (v1)"
                    newLabel={`Active Editor (v${selectedContent?.currentVersionNumber || versions.length})`}
                  />
                </div>
              )}

              {/* Content Editor / Draft Box */}
              <form onSubmit={handleSubmitRevision} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Draft Body Copy (Live Editor)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Click "Accept Fix" on any finding card to automatically replace text.
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    disabled={isApproved}
                    value={workingText}
                    onChange={(e) => setWorkingText(e.target.value)}
                    className="w-full p-3.5 text-sm font-sans border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600 leading-relaxed"
                  />
                </div>

                {!isApproved && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <input
                      type="text"
                      placeholder="What changed? e.g. Replaced unverified claim with SLA citation"
                      value={revisionSummary}
                      onChange={(e) => setRevisionSummary(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={submittingRevision}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
                    >
                      {submittingRevision ? 'Re-reviewing...' : `Submit Revision (v${(selectedContent.currentVersionNumber || 1) + 1})`}
                    </button>
                  </div>
                )}
              </form>

              {/* Comments Stream */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  Review Comments & Thread ({comments.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {comments.map((cm) => (
                    <div key={cm._id} className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-100">
                      <div className="flex justify-between text-slate-400 text-[10px]">
                        <strong>{cm.authorId?.name || 'Reviewer'}</strong>
                        <span>{new Date(cm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-700">{cm.body}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Leave feedback or reply..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium">
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Explainable Findings Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-brand-400" />
              <div>
                <h3 className="font-semibold text-sm">Review Findings</h3>
                <p className="text-[11px] text-slate-400">
                  {latestReview?.findings?.length || 0} checks completed &bull; Explainable citations
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-brand-300 bg-brand-950 px-2 py-1 rounded border border-brand-800">
              {latestReview?.processingMetadata?.executionTimeMs || 0}ms
            </span>
          </div>

          {/* Finding Cards List */}
          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {latestReview?.findings && latestReview.findings.length > 0 ? (
              latestReview.findings.map((f) => {
                const isOverridden = f.reviewStatus === 'OVERRIDDEN';
                const isRejected = f.reviewStatus === 'REJECTED';

                return (
                  <div
                    key={f._id}
                    className={`bg-white rounded-xl border p-4 shadow-sm space-y-3 transition-all ${
                      isOverridden
                        ? 'border-slate-300 opacity-60 bg-slate-50'
                        : f.type === 'CLAIM_UNSUPPORTED'
                        ? 'border-purple-200 bg-purple-50/20'
                        : f.type === 'TERMINOLOGY'
                        ? 'border-rose-200'
                        : f.type === 'CLAIM_SUPPORTED'
                        ? 'border-emerald-200'
                        : 'border-amber-200'
                    }`}
                  >
                    {/* Header Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          f.type === 'TERMINOLOGY'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : f.type === 'TONE_MISMATCH'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : f.type === 'CLAIM_UNSUPPORTED'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : f.type === 'CLAIM_SUPPORTED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {f.type}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {f.checkMethod === 'DETERMINISTIC' ? '100% Deterministic' : `AI ${Math.round(f.confidence * 100)}%`}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        f.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {f.severity}
                      </span>
                    </div>

                    {/* Original Flagged Text */}
                    <div className="text-xs">
                      <span className="text-[11px] text-slate-400 font-medium">Flagged Text:</span>
                      <div className="font-mono text-xs text-rose-800 bg-rose-50/70 p-2 rounded border border-rose-100 mt-0.5">
                        "{f.originalText}"
                      </div>
                    </div>

                    {/* Explanation */}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {f.explanation}
                    </p>

                    {/* Grounded Evidence Citation (Blueprint Section 6.8 & 11.2) */}
                    {f.sourceReferences && f.sourceReferences.length > 0 ? (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] space-y-1">
                        <div className="font-semibold text-slate-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                          <span>Approved Source Evidence:</span>
                        </div>
                        <p className="text-slate-600 italic">"{f.sourceReferences[0].quote}"</p>
                      </div>
                    ) : f.type === 'CLAIM_UNSUPPORTED' ? (
                      <div className="p-2 bg-purple-50 rounded-lg border border-purple-200 text-[11px] text-purple-900 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span><strong>No Approved Citation Found:</strong> System does not fabricate facts.</span>
                      </div>
                    ) : null}

                    {/* Suggested Intent-Preserving Correction */}
                    {f.suggestedCorrection && !isOverridden && (
                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-2">
                        <div className="font-semibold text-emerald-800 text-[11px]">Suggested Fix:</div>
                        <div className="font-medium text-emerald-900">"{f.suggestedCorrection}"</div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleApplyFix(f.originalText, f.suggestedCorrection)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Accept Fix</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectModalFinding(f)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-[11px] font-medium transition-colors"
                          >
                            Reject
                          </button>
                          {(activeRole === 'ADMIN' || activeRole === 'REVIEWER' || activeRole === 'MANAGER') && (
                            <button
                              type="button"
                              onClick={() => setOverrideModalFinding(f)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 rounded text-[11px] font-semibold transition-colors ml-auto"
                            >
                              Override Flag
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Overridden state note */}
                    {isOverridden && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                        <strong>Reviewer Override:</strong> {f.overrideReason}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-800">No Brand Violations Found!</h4>
                <p className="text-xs text-slate-500">All text complies with brand rules, tone, and approved claims.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Submission Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">New Content Submission</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmission} className="p-6 space-y-4">
              {!activeOrg && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Please sign in or switch to an organisation workspace to submit content.</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Content Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q4 Cloud Product Announcement"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Channel</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="Social Media">Social Media</option>
                    <option value="Website / Landing Page">Website / Landing Page</option>
                    <option value="Email Newsletter">Email Newsletter</option>
                    <option value="Pitch Deck / Presentation">Presentation</option>
                    <option value="Brochure / Print">Brochure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value)}
                    placeholder="e.g. Enterprise Decision Makers"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Draft Copy</label>
                <textarea
                  required
                  rows={5}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Paste marketing copy or text to review..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none leading-relaxed"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !activeOrg?._id}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                {submitting ? 'Analyzing Draft...' : 'Submit & Run Automated Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Override Justification Modal (Blueprint Section 5: Mandatory Reason) */}
      {overrideModalFinding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Record Justified Reviewer Override</h3>
            <p className="text-xs text-slate-500">
              Blueprint compliance requires an explicit reason when overruling an automated brand flag. This decision will be permanently logged in the audit trail.
            </p>
            <textarea
              rows={3}
              required
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Authorized by brand director for seasonal promotion campaign..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOverrideModalFinding(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOverrideFinding}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalFinding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Decline Suggestion</h3>
            <p className="text-xs text-slate-500">
              Please provide a short note on why you are declining this suggested fix:
            </p>
            <input
              type="text"
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Existing phrase has specific regulatory context..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalFinding(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectFinding}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
