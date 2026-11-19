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
  GitCompare,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Palette,
  Edit3,
  SlidersHorizontal,
  CheckCheck,
  Undo2,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Volume2,
  BookOpen,
  Quote
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
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileAltTexts, setFileAltTexts] = useState({});
  const [fileError, setFileError] = useState(null);

  // Editing / Version Revision in workspace
  const [workingText, setWorkingText] = useState('');
  const [revisionSummary, setRevisionSummary] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  // Overrides / Comments / Rejections / Edits
  const [commentInput, setCommentInput] = useState('');
  const [overrideModalFinding, setOverrideModalFinding] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalFinding, setRejectModalFinding] = useState(null);
  const [editModalFinding, setEditModalFinding] = useState(null);
  const [editedSuggestionText, setEditedSuggestionText] = useState('');

  // Side-by-Side Version Diff comparison
  const [diffBaseVersionId, setDiffBaseVersionId] = useState('');
  const [diffTargetVersionId, setDiffTargetVersionId] = useState('current_draft');

  // Findings Panel Controls & Filtering
  const [findingFilter, setFindingFilter] = useState('ALL'); // ALL, PENDING, TERMINOLOGY, TONE, CLAIMS, VISUAL, RESOLVED
  const [findingSearch, setFindingSearch] = useState('');
  const [compactView, setCompactView] = useState(false);
  const [expandedFindings, setExpandedFindings] = useState({});
  const [batchApplying, setBatchApplying] = useState(false);

  const loadContents = useCallback(async () => {
    if (!activeOrg?._id || !token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getContents(activeOrg._id, token);
      const items = data.contents || [];
      setContents(items);
      setSelectedContentId((prev) => {
        if (prev && items.some((item) => item._id === prev)) return prev;
        return items[0]?._id ?? null;
      });
      if (items.length === 0) {
        setSelectedContent(null);
        setVersions([]);
        setLatestReview(null);
        setComments([]);
        setWorkingText('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeOrg, token]);

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

  // Keyboard Escape listener to dismiss modals cleanly without page refresh
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showNewModal) setShowNewModal(false);
        if (overrideModalFinding) setOverrideModalFinding(null);
        if (rejectModalFinding) setRejectModalFinding(null);
        if (editModalFinding) setEditModalFinding(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNewModal, overrideModalFinding, rejectModalFinding, editModalFinding]);

  // Sync default diff versions whenever versions change
  useEffect(() => {
    if (versions.length > 0) {
      if (!diffBaseVersionId || !versions.some((v) => v._id === diffBaseVersionId)) {
        setDiffBaseVersionId(versions[0]._id);
      }
    }
  }, [versions, diffBaseVersionId]);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    setFileError(null);
    if (!selected.length) return;

    const allowedExts = /\.(pdf|docx|doc|jpg|jpeg|png|webp|txt)$/i;
    const valid = [];

    for (const f of selected) {
      if (!allowedExts.test(f.name)) {
        setFileError(`"${f.name}" has an unsupported format. Please upload PDF, DOCX, JPG, or PNG.`);
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setFileError(`"${f.name}" exceeds the 10MB limit (${(f.size / (1024 * 1024)).toFixed(1)}MB).`);
        return;
      }
      valid.push(f);
    }

    setUploadedFiles((prev) => [...prev, ...valid].slice(0, 5));
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles((prev) => {
      const updated = [...prev];
      const removed = updated.splice(index, 1)[0];
      if (removed && fileAltTexts[removed.name]) {
        const nextAlt = { ...fileAltTexts };
        delete nextAlt[removed.name];
        setFileAltTexts(nextAlt);
      }
      return updated;
    });
  };

  const handleCreateSubmission = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFileError('Please enter a content title.');
      return;
    }
    if (!newText.trim() && uploadedFiles.length === 0) {
      setFileError('Please provide draft copy or upload a supported document (.pdf, .docx, or image).');
      return;
    }

    if (!activeOrg?._id || !token) {
      setError('Please sign in or select an organisation workspace before submitting draft content.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setFileError(null);
    try {
      const res = await api.createContent(
        activeOrg._id,
        {
          title: newTitle,
          channel: newChannel,
          audience: newAudience,
          text: newText,
          files: uploadedFiles,
          altTexts: fileAltTexts,
        },
        token
      );
      setSuccessMsg('Content submitted and automated review completed!');
      setShowNewModal(false);
      setNewTitle('');
      setNewText('');
      setUploadedFiles([]);
      setFileAltTexts({});
      if (res?.content?._id) {
        setSelectedContentId(res.content._id);
        await loadContents();
        await loadContentDetails(res.content._id);
      } else {
        await loadContents();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit draft content');
      setFileError(err.message || 'Extraction or submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyFix = async (finding) => {
    if (!finding?.suggestedCorrection) return;
    const original = finding.originalText;
    const suggestion = finding.suggestedCorrection;
    setWorkingText((prev) => (prev ? prev.replace(original, suggestion) : suggestion));
    setSuccessMsg(`Applied fix: "${suggestion}"`);

    if (finding._id && activeOrg?._id && selectedContentId && token) {
      try {
        await api.updateFindingDecision(
          activeOrg._id,
          selectedContentId,
          finding._id,
          { reviewStatus: 'ACCEPTED' },
          token
        );
        setLatestReview((prev) => {
          if (!prev?.findings) return prev;
          return {
            ...prev,
            findings: prev.findings.map((item) =>
              item._id === finding._id ? { ...item, reviewStatus: 'ACCEPTED' } : item
            ),
          };
        });
      } catch (err) {
        console.error('Failed to record accepted finding decision:', err);
      }
    }
  };

  const handleOpenEditModal = (finding) => {
    setEditModalFinding(finding);
    setEditedSuggestionText(finding.editedText || finding.suggestedCorrection || '');
  };

  const handleApplyEditedFix = async () => {
    if (!editModalFinding || !editedSuggestionText.trim()) return;
    const original = editModalFinding.originalText;
    const replacement = editedSuggestionText.trim();
    const findingToUpdate = editModalFinding;

    // Immediately update draft and close modal
    setWorkingText((prev) => (prev ? prev.replace(original, replacement) : replacement));
    setEditModalFinding(null);
    setEditedSuggestionText('');
    setSuccessMsg(`Applied custom edited fix: "${replacement}"`);

    if (findingToUpdate._id && activeOrg?._id && selectedContentId && token) {
      try {
        await api.updateFindingDecision(
          activeOrg._id,
          selectedContentId,
          findingToUpdate._id,
          { reviewStatus: 'EDITED', editedText: replacement },
          token
        );
        setLatestReview((prev) => {
          if (!prev?.findings) return prev;
          return {
            ...prev,
            findings: prev.findings.map((item) =>
              item._id === findingToUpdate._id
                ? { ...item, reviewStatus: 'EDITED', editedText: replacement }
                : item
            ),
          };
        });
      } catch (err) {
        console.error('Failed to record edited finding decision:', err);
      }
    }
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
        { reviewStatus: 'REJECTED', rejectionReason: rejectReason.trim() },
        token
      );
      setLatestReview((prev) => {
        if (!prev?.findings) return prev;
        return {
          ...prev,
          findings: prev.findings.map((item) =>
            item._id === rejectModalFinding._id
              ? { ...item, reviewStatus: 'REJECTED', rejectionReason: rejectReason.trim() }
              : item
          ),
        };
      });
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

  const handleApplyAllSuggestions = async () => {
    if (!latestReview?.findings || isApproved || batchApplying) return;
    const pendingFixable = latestReview.findings.filter(
      (f) => Boolean(f.suggestedCorrection) && (!f.reviewStatus || f.reviewStatus === 'PENDING')
    );
    if (pendingFixable.length === 0) return;

    setBatchApplying(true);
    let updatedText = workingText;
    const appliedIds = [];

    for (const f of pendingFixable) {
      if (f.originalText && f.suggestedCorrection) {
        updatedText = updatedText.replace(f.originalText, f.suggestedCorrection);
        appliedIds.push(f._id);
      }
    }

    setWorkingText(updatedText);
    setSuccessMsg(`Auto-applied ${appliedIds.length} recommended brand fixes to draft copy.`);

    if (activeOrg?._id && selectedContentId && token) {
      try {
        await Promise.all(
          appliedIds.map((fId) =>
            api.updateFindingDecision(
              activeOrg._id,
              selectedContentId,
              fId,
              { reviewStatus: 'ACCEPTED' },
              token
            )
          )
        );

        setLatestReview((prev) => {
          if (!prev?.findings) return prev;
          return {
            ...prev,
            findings: prev.findings.map((item) =>
              appliedIds.includes(item._id) ? { ...item, reviewStatus: 'ACCEPTED' } : item
            ),
          };
        });
      } catch (err) {
        console.error('Batch update failed:', err);
      }
    }
    setBatchApplying(false);
  };

  const handleUndoDecision = async (finding) => {
    if (!finding?._id || !activeOrg?._id || !selectedContentId || !token || isApproved) return;
    try {
      await api.updateFindingDecision(
        activeOrg._id,
        selectedContentId,
        finding._id,
        { reviewStatus: 'PENDING' },
        token
      );
      setLatestReview((prev) => {
        if (!prev?.findings) return prev;
        return {
          ...prev,
          findings: prev.findings.map((item) =>
            item._id === finding._id
              ? {
                  ...item,
                  reviewStatus: 'PENDING',
                  rejectionReason: undefined,
                  overrideReason: undefined,
                  editedText: undefined,
                }
              : item
          ),
        };
      });
      setSuccessMsg('Reverted finding back to pending review.');
    } catch (err) {
      setError(err.message || 'Failed to revert decision');
    }
  };

  const toggleCitation = (findingId) => {
    setExpandedFindings((prev) => ({
      ...prev,
      [findingId]: !prev[findingId],
    }));
  };

  // Findings analytics & breakdown
  const rawFindings = latestReview?.findings || [];
  const findingsCount = rawFindings.length;

  const counts = {
    terminology: rawFindings.filter((f) => f.type === 'TERMINOLOGY').length,
    tone: rawFindings.filter((f) => f.type === 'TONE_MISMATCH').length,
    unsupportedClaims: rawFindings.filter((f) => f.type === 'CLAIM_UNSUPPORTED').length,
    supportedClaims: rawFindings.filter((f) => f.type === 'CLAIM_SUPPORTED').length,
    accessibility: rawFindings.filter((f) =>
      ['CONTRAST_FAIL', 'ALT_TEXT_MISSING', 'ACCESSIBILITY'].includes(f.type)
    ).length,
  };

  const resolvedCount = rawFindings.filter(
    (f) => f.reviewStatus && f.reviewStatus !== 'PENDING'
  ).length;

  const pendingCount = findingsCount - resolvedCount;

  const readinessPercentage =
    findingsCount === 0 ? 100 : Math.round((resolvedCount / findingsCount) * 100);

  const availableFixCount = rawFindings.filter(
    (f) => Boolean(f.suggestedCorrection) && (!f.reviewStatus || f.reviewStatus === 'PENDING')
  ).length;

  // Filtered findings based on tab and search
  const filteredFindings = rawFindings.filter((f) => {
    if (findingFilter === 'PENDING' && f.reviewStatus && f.reviewStatus !== 'PENDING') {
      return false;
    }
    if (findingFilter === 'RESOLVED' && (!f.reviewStatus || f.reviewStatus === 'PENDING')) {
      return false;
    }
    if (findingFilter === 'TERMINOLOGY' && f.type !== 'TERMINOLOGY') {
      return false;
    }
    if (findingFilter === 'TONE' && f.type !== 'TONE_MISMATCH') {
      return false;
    }
    if (findingFilter === 'CLAIMS' && !['CLAIM_UNSUPPORTED', 'CLAIM_SUPPORTED'].includes(f.type)) {
      return false;
    }
    if (
      findingFilter === 'VISUAL' &&
      !['CONTRAST_FAIL', 'ALT_TEXT_MISSING', 'ACCESSIBILITY'].includes(f.type)
    ) {
      return false;
    }

    if (findingSearch.trim()) {
      const q = findingSearch.toLowerCase();
      const matchText = (f.originalText || '').toLowerCase().includes(q);
      const matchExpl = (f.explanation || '').toLowerCase().includes(q);
      const matchSug = (f.suggestedCorrection || '').toLowerCase().includes(q);
      const matchType = (f.type || '').toLowerCase().includes(q);
      return matchText || matchExpl || matchSug || matchType;
    }

    return true;
  });

  const isApproved = selectedContent?.status === 'APPROVED';

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Content Review Studio</span>
            <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              Interactive
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit marketing copy, verify grounded factual claims, apply deterministic terminology fixes, and request sign-offs.
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
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-brand-500/20 hover:shadow-md transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Load Demo Sample</span>
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
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
        <div className="lg:col-span-7 space-y-5 lg:space-y-6">
          {/* Submissions Switcher Bar */}
          <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-xs flex items-center gap-2 overflow-x-auto touch-scroll no-scrollbar min-h-[48px]">
            <span className="text-[10px] font-bold text-slate-400 shrink-0 px-2 sm:px-2.5 uppercase tracking-wider">
              Submissions:
            </span>
            {contents.length === 0 ? (
              <span className="text-xs text-slate-400 px-1">No submissions yet</span>
            ) : (
              contents.map((c) => {
                const isSelected = c._id === selectedContentId;
                return (
                  <button
                    key={c._id}
                    onClick={() => setSelectedContentId(c._id)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-800'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    <span className="truncate max-w-[110px] sm:max-w-[130px]">{c.title}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                    }`}>
                      v{c.currentVersionNumber || 1}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {!selectedContent && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-10 sm:p-12 shadow-xs text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200/70 flex items-center justify-center text-brand-600 mx-auto">
                <FileText className="w-6 h-6 stroke-[1.9]" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-sm font-bold text-slate-800">No Content Submissions Yet</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Create a new content submission or load the interactive demo sample to run grounded brand compliance checks, terminology enforcement, and approval workflows.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setNewTitle('NovaTech Cloud Launch Campaign');
                    setNewChannel('Social Media');
                    setNewAudience('Enterprise Decision Makers');
                    setNewText(SAMPLE_DEMO_DRAFT);
                    setShowNewModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-brand-500/20 hover:shadow-md transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Load Demo Sample</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>New Submission</span>
                </button>
              </div>
            </div>
          )}

          {selectedContent && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-5">
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
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0">
                    <History className="w-3.5 h-3.5" /> Versions:
                  </span>
                  {versions.map((v) => {
                    const isCurrent = v.versionNumber === selectedContent.currentVersionNumber;
                    return (
                      <button
                        key={v._id}
                        type="button"
                        onClick={() => {
                          if (!isApproved) setWorkingText(v.text);
                          setDiffBaseVersionId(v._id);
                          setSuccessMsg(`Loaded copy from version v${v.versionNumber}: "${v.changeSummary}"`);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-colors shrink-0 flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-brand-50 border-brand-300 text-brand-700 font-bold'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                        title={v.changeSummary || `Version ${v.versionNumber}`}
                      >
                        <span>v{v.versionNumber}</span>
                        {isCurrent && <span className="text-[10px] text-brand-600 font-sans font-semibold">(current)</span>}
                      </button>
                    );
                  })}
                </div>

                {versions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowDiff((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
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

              {/* Side-by-Side / Unified Visual Diff Viewer */}
              {showDiff && (() => {
                const baseVersionObj = versions.find((v) => v._id === diffBaseVersionId) || versions[0] || null;
                const targetVersionObj = diffTargetVersionId === 'current_draft'
                  ? null
                  : (versions.find((v) => v._id === diffTargetVersionId) || null);
                const diffOldText = baseVersionObj?.text || '';
                const diffNewText = diffTargetVersionId === 'current_draft'
                  ? workingText
                  : (targetVersionObj?.text || '');
                const diffOldLabel = baseVersionObj
                  ? `Base v${baseVersionObj.versionNumber} (${baseVersionObj.changeSummary || 'Original Draft'})`
                  : 'Base Version';
                const diffNewLabel = diffTargetVersionId === 'current_draft'
                  ? `Active Editor Draft (v${(selectedContent?.currentVersionNumber || 1) + 1})`
                  : targetVersionObj
                  ? `Target v${targetVersionObj.versionNumber} (${targetVersionObj.changeSummary || 'Revision'})`
                  : 'Target Version';

                return (
                  <div className="my-3 animate-in fade-in duration-200 space-y-2.5">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-700">Base Version:</span>
                        <select
                          value={diffBaseVersionId || (versions[0]?._id || '')}
                          onChange={(e) => setDiffBaseVersionId(e.target.value)}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        >
                          {versions.map((v) => (
                            <option key={v._id} value={v._id}>
                              v{v.versionNumber} ({v.changeSummary || `Version ${v.versionNumber}`})
                            </option>
                          ))}
                        </select>

                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                        <span className="font-bold text-slate-700">Compare Target:</span>
                        <select
                          value={diffTargetVersionId}
                          onChange={(e) => setDiffTargetVersionId(e.target.value)}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        >
                          <option value="current_draft">
                            Active Editor Draft {workingText !== (selectedContent.currentVersionId?.text || '') ? '(Unsaved Edits)' : ''}
                          </option>
                          {versions.map((v) => (
                            <option key={v._id} value={v._id}>
                              v{v.versionNumber} ({v.changeSummary || `Version ${v.versionNumber}`})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        Toggle between <strong>Side-by-Side</strong> and <strong>Unified</strong> mode inside toolbar below
                      </div>
                    </div>

                    <DiffViewer
                      oldText={diffOldText}
                      newText={diffNewText}
                      oldLabel={diffOldLabel}
                      newLabel={diffNewLabel}
                    />
                  </div>
                );
              })()}

              {/* Attached Media & Documents Strip */}
              {versions[versions.length - 1]?.fileReferences?.length > 0 && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-brand-600" />
                      <span>Attached Documents & Media ({versions[versions.length - 1].fileReferences.length})</span>
                    </span>
                    <span className="text-[11px] text-slate-400">OCR & Accessibility Verified</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {versions[versions.length - 1].fileReferences.map((fRef, fIdx) => (
                      <div key={fIdx} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-start gap-2.5 shadow-2xs">
                        {fRef.mimeType?.startsWith('image/') || fRef.storageKey?.includes('image') || /\.(jpg|jpeg|png|webp)$/i.test(fRef.originalName) ? (
                          <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                            {fRef.storageKey?.startsWith('http') ? (
                              <img src={fRef.storageKey} alt={fRef.altText || fRef.originalName} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-indigo-500" />
                            )}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-200">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={fRef.originalName}>
                            {fRef.originalName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {fRef.altText ? `Alt: "${fRef.altText}"` : 'No Alt Text'}
                          </p>
                          {fRef.visualChecks?.contrast && (
                            <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                              Contrast: <strong>{fRef.visualChecks.contrast.ratio}:1</strong> ({fRef.visualChecks.contrast.rating})
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval Lock Passport Banner */}
              {isApproved && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                        <span>Approval Sign-off Locked</span>
                        <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                          v{selectedContent.currentVersionNumber} IMMUTABLE
                        </span>
                      </h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        This content version has received formal management approval and is locked against further edits.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-white/90 border border-emerald-300 px-3 py-1.5 rounded-xl shadow-2xs shrink-0 flex items-center gap-1.5 self-end sm:self-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Protected Version</span>
                  </span>
                </div>
              )}

              {/* Content Editor / Draft Box */}
              <form onSubmit={handleSubmitRevision} className="space-y-4">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                      {isApproved && <Lock className="w-3.5 h-3.5 text-emerald-600" />}
                      <span>Draft Body Copy {isApproved ? '(Locked)' : '(Live Editor)'}</span>
                    </label>
                    <span className="text-[11px] text-slate-400 sm:text-right leading-snug">
                      {isApproved
                        ? 'Approved versions are immutable across all publishing channels'
                        : 'Use Accept, Edit, or Reject on findings to apply suggestions.'}
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    disabled={isApproved}
                    value={workingText}
                    onChange={(e) => setWorkingText(e.target.value)}
                    className="w-full p-3.5 text-sm font-sans border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100/80 disabled:text-slate-600 disabled:cursor-not-allowed leading-relaxed"
                  />
                </div>

                {!isApproved ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                    <input
                      type="text"
                      placeholder="Summary of changes (e.g. Verified SLA claim)"
                      value={revisionSummary}
                      onChange={(e) => setRevisionSummary(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={submittingRevision}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors shrink-0"
                    >
                      {submittingRevision ? 'Re-reviewing...' : `Submit Revision (v${(selectedContent.currentVersionNumber || 1) + 1})`}
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Editing disabled for officially approved content.</span>
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-600">
                      Final Version: v{selectedContent.currentVersionNumber}
                    </span>
                  </div>
                )}
              </form>

              {/* Comments Stream */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  Review Comments & Thread ({comments.length})
                </h4>
                {comments.length > 0 && (
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
                )}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Leave feedback or reply..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors shrink-0">
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Explainable Findings & Governance Studio (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 lg:h-[calc(100vh-6.5rem)] flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          
          {/* 1. Header Bar: Editorial Dark Theme */}
          <div className="bg-slate-950 text-white p-4 shrink-0 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-400/30">
                <FileCheck2 className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white leading-tight">Review Findings</h3>
                  {findingsCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      {findingsCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Explainable governance & citations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Density View Toggle */}
              <button
                type="button"
                onClick={() => setCompactView((prev) => !prev)}
                className={`p-1.5 rounded-lg text-xs transition-colors border ${
                  compactView
                    ? 'bg-brand-600 text-white border-brand-500'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title={compactView ? "Switch to Detailed Cards" : "Switch to Compact List"}
                aria-label="Toggle card density"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* Execution Time Pill */}
              <span className="text-[10px] font-mono font-semibold text-brand-300 bg-brand-950/90 px-2 py-1 rounded-md border border-brand-800/80">
                {latestReview?.processingMetadata?.executionTimeMs || 0}ms
              </span>
            </div>
          </div>

          {/* 2. Compliance Readiness Progress Bar & Breakdown */}
          {selectedContent && findingsCount > 0 && (
            <div className="p-3 bg-slate-50/90 border-b border-slate-200/80 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-700 text-[11px]">Compliance Readiness:</span>
                  <span className={`font-extrabold font-mono text-[11px] ${
                    readinessPercentage === 100 ? 'text-emerald-700' : 'text-brand-700'
                  }`}>
                    {readinessPercentage}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {resolvedCount} of {findingsCount} resolved
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    readinessPercentage === 100
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-brand-500 to-indigo-600'
                  }`}
                  style={{ width: `${readinessPercentage}%` }}
                />
              </div>

              {/* Breakdown Category Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll no-scrollbar pt-0.5">
                {counts.terminology > 0 && (
                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>{counts.terminology} Terminology</span>
                  </span>
                )}
                {counts.tone > 0 && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{counts.tone} Tone</span>
                  </span>
                )}
                {counts.unsupportedClaims > 0 && (
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>{counts.unsupportedClaims} Fact Claims</span>
                  </span>
                )}
                {counts.supportedClaims > 0 && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{counts.supportedClaims} Verified</span>
                  </span>
                )}
                {counts.accessibility > 0 && (
                  <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    <span>{counts.accessibility} Visual</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 3. Filter Tabs & Search Controls */}
          {selectedContent && findingsCount > 0 && (
            <div className="p-2.5 bg-white border-b border-slate-100 space-y-2 shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto touch-scroll no-scrollbar py-0.5">
                {[
                  { id: 'ALL', label: `All (${findingsCount})` },
                  { id: 'PENDING', label: `Needs Action (${pendingCount})`, highlight: pendingCount > 0 },
                  { id: 'TERMINOLOGY', label: `Terminology (${counts.terminology})` },
                  { id: 'TONE', label: `Tone (${counts.tone})` },
                  { id: 'CLAIMS', label: `Claims (${counts.unsupportedClaims + counts.supportedClaims})` },
                  { id: 'VISUAL', label: `Visual (${counts.accessibility})` },
                  { id: 'RESOLVED', label: `Resolved (${resolvedCount})` },
                ].filter(tab => tab.id === 'ALL' || tab.id === 'PENDING' || !tab.label.includes('(0)')).map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFindingFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                      findingFilter === tab.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : tab.highlight
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80'
                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Quick Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={findingSearch}
                  onChange={(e) => setFindingSearch(e.target.value)}
                  placeholder="Filter findings by term, claim, or rule..."
                  className="w-full pl-8 pr-7 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
                />
                {findingSearch && (
                  <button
                    type="button"
                    onClick={() => setFindingSearch('')}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-1.5 top-1/2 -translate-y-1/2"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. Batch Quick Action Banner (When >1 auto-fixable finding exists) */}
          {availableFixCount > 1 && !isApproved && (
            <div className="px-3.5 py-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-emerald-200/80 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-emerald-950 truncate">
                  {availableFixCount} suggested fixes ready
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplyAllSuggestions}
                disabled={batchApplying}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-all shrink-0 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{batchApplying ? 'Applying...' : 'Apply All Fixes'}</span>
              </button>
            </div>
          )}

          {/* 5. Scrollable Findings Cards Container (Flex-1) */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 space-y-3 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            {!selectedContent ? (
              <div className="bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
                  <FileCheck2 className="w-5 h-5 text-slate-400 stroke-[1.9]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">Awaiting Submission</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Select or create a submission on the left to inspect explainable findings, grounded citations, and deterministic fixes.
                  </p>
                </div>
              </div>
            ) : findingsCount === 0 ? (
              <div className="bg-gradient-to-b from-emerald-50/70 to-teal-50/30 rounded-2xl border border-emerald-200/90 p-8 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-950">100% Brand Compliant</h4>
                  <p className="text-xs text-emerald-800 max-w-xs mx-auto leading-relaxed">
                    No violations detected. All terminology, tone guidelines, and factual claims are fully verified and substantiated.
                  </p>
                </div>
                {!isApproved && (
                  <button
                    type="button"
                    onClick={handleRequestApproval}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Request Sign-off</span>
                  </button>
                )}
              </div>
            ) : filteredFindings.length === 0 ? (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center space-y-2">
                <Filter className="w-6 h-6 text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">No Matching Findings</h4>
                <p className="text-[11px] text-slate-500">
                  No issues match the selected filter &bull; "{findingFilter}"
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFindingFilter('ALL');
                    setFindingSearch('');
                  }}
                  className="text-xs font-semibold text-brand-600 hover:underline pt-1"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredFindings.map((f) => {
                const isOverridden = f.reviewStatus === 'OVERRIDDEN';
                const isRejected = f.reviewStatus === 'REJECTED';
                const isAccepted = f.reviewStatus === 'ACCEPTED';
                const isEdited = f.reviewStatus === 'EDITED';
                const isResolved = isAccepted || isEdited || isRejected || isOverridden;
                const isCitationExpanded = Boolean(expandedFindings[f._id]);

                // Border accent styling per category
                const leftAccent = isOverridden
                  ? 'border-l-slate-400'
                  : f.type === 'TERMINOLOGY'
                  ? 'border-l-rose-500'
                  : f.type === 'TONE_MISMATCH'
                  ? 'border-l-amber-500'
                  : f.type === 'CLAIM_UNSUPPORTED'
                  ? 'border-l-purple-500'
                  : f.type === 'CLAIM_SUPPORTED'
                  ? 'border-l-emerald-500'
                  : 'border-l-sky-500';

                // COMPACT CARD VIEW
                if (compactView) {
                  return (
                    <div
                      key={f._id}
                      className={`p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2 border-l-[3.5px] ${leftAccent} transition-all hover:shadow-xs`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                            f.type === 'TERMINOLOGY'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : f.type === 'TONE_MISMATCH'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : f.type === 'CLAIM_UNSUPPORTED'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : f.type === 'CLAIM_SUPPORTED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}>
                            {f.type}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-800 truncate">
                            "{f.originalText}"
                          </span>
                        </div>

                        {/* Status Chip or Quick Action */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isResolved ? (
                            <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                              {isAccepted && <Check className="w-3 h-3 text-emerald-600" />}
                              {isEdited && <Edit3 className="w-3 h-3 text-indigo-600" />}
                              {isRejected && <X className="w-3 h-3 text-rose-600" />}
                              {isOverridden && <Lock className="w-3 h-3 text-amber-600" />}
                              <span>{f.reviewStatus}</span>
                            </span>
                          ) : f.suggestedCorrection && !isApproved ? (
                            <button
                              type="button"
                              onClick={() => handleApplyFix(f)}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-0.5"
                            >
                              <Check className="w-2.5 h-2.5" />
                              <span>Fix</span>
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {f.suggestedCorrection && (
                        <div className="text-[11px] text-emerald-900 bg-emerald-50/70 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1 truncate font-mono">
                          <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">"{f.suggestedCorrection}"</span>
                        </div>
                      )}
                    </div>
                  );
                }

                // DETAILED PROFESSIONAL CARD VIEW
                return (
                  <div
                    key={f._id}
                    className={`bg-white rounded-xl border p-4 shadow-2xs space-y-3 transition-all duration-150 hover:shadow-xs border-l-[3.5px] ${leftAccent} ${
                      isOverridden
                        ? 'border-slate-300 opacity-65 bg-slate-50/70'
                        : isResolved
                        ? 'border-slate-200/90 bg-white'
                        : f.type === 'CLAIM_UNSUPPORTED'
                        ? 'border-purple-200 bg-purple-50/15'
                        : f.type === 'TERMINOLOGY'
                        ? 'border-rose-200/90 bg-white'
                        : f.type === 'CLAIM_SUPPORTED'
                        ? 'border-emerald-200 bg-emerald-50/15'
                        : 'border-amber-200 bg-amber-50/15'
                    }`}
                  >
                    {/* Header Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${
                          f.type === 'TERMINOLOGY'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : f.type === 'TONE_MISMATCH'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : f.type === 'CLAIM_UNSUPPORTED'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : f.type === 'CLAIM_SUPPORTED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : f.type === 'CONTRAST_FAIL'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {f.type === 'TERMINOLOGY' && <BookOpen className="w-2.5 h-2.5" />}
                          {f.type === 'TONE_MISMATCH' && <Volume2 className="w-2.5 h-2.5" />}
                          {f.type === 'CLAIM_UNSUPPORTED' && <ShieldAlert className="w-2.5 h-2.5" />}
                          {f.type === 'CLAIM_SUPPORTED' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {['CONTRAST_FAIL', 'ALT_TEXT_MISSING', 'ACCESSIBILITY'].includes(f.type) && <Eye className="w-2.5 h-2.5" />}
                          <span>{f.type}</span>
                        </span>

                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {f.checkMethod === 'DETERMINISTIC' ? '100% Deterministic' : `AI ${Math.round(f.confidence * 100)}%`}
                        </span>

                        {/* Finding Decision Status Badge */}
                        {isAccepted && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Accepted</span>
                          </span>
                        )}
                        {isEdited && (
                          <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            <span>Custom Edited</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <X className="w-3 h-3" />
                            <span>Declined</span>
                          </span>
                        )}
                        {isOverridden && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                            Overridden
                          </span>
                        )}
                      </div>

                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        f.severity === 'CRITICAL' 
                          ? 'bg-rose-100 text-rose-800' 
                          : f.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {f.severity}
                      </span>
                    </div>

                    {/* Clean Diff Transformation Box */}
                    {f.suggestedCorrection ? (
                      <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>Recommended Transformation:</span>
                          <span className="font-mono">{f.checkMethod === 'DETERMINISTIC' ? 'Lexicon Match' : 'Context-aware'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="text-rose-800 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded font-semibold truncate max-w-[140px]" title={f.originalText}>
                            "{f.originalText}"
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded font-semibold truncate max-w-[160px]" title={f.suggestedCorrection}>
                            "{f.suggestedCorrection}"
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs">
                        <span className="text-[11px] text-slate-400 font-medium">Flagged Text:</span>
                        <div className="font-mono text-xs text-rose-800 bg-rose-50/70 p-2 rounded-lg border border-rose-100 mt-0.5">
                          "{f.originalText}"
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {f.explanation}
                    </p>

                    {/* Grounded Citation Evidence / Hallucination-prevention Callout */}
                    {f.sourceReferences && f.sourceReferences.length > 0 ? (
                      <div className="rounded-xl border border-slate-200/80 overflow-hidden text-[11px]">
                        <button
                          type="button"
                          onClick={() => toggleCitation(f._id)}
                          className="w-full p-2 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-slate-700 font-semibold transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <Quote className="w-3.5 h-3.5 text-brand-600" />
                            <span>Approved Source Evidence</span>
                          </span>
                          {isCitationExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                        {isCitationExpanded && (
                          <div className="p-2.5 bg-white border-t border-slate-200/80 text-slate-600 italic">
                            "{f.sourceReferences[0].quote}"
                          </div>
                        )}
                      </div>
                    ) : f.type === 'CLAIM_UNSUPPORTED' ? (
                      <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 text-[11px] text-purple-900 flex items-start gap-2 leading-snug">
                        <HelpCircle className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span><strong>No Approved Citation Found:</strong> System enforces zero-fabrication. Source must be substantiated before publishing.</span>
                      </div>
                    ) : null}

                    {/* Customized Applied Fix Details */}
                    {isEdited && f.editedText && (
                      <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> Custom Replacement Applied:
                        </span>
                        <p className="font-semibold text-indigo-950 font-sans">"{f.editedText}"</p>
                      </div>
                    )}

                    {/* Declined Reason Details */}
                    {isRejected && f.rejectionReason && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-900">
                        <strong>Declined Reason:</strong> {f.rejectionReason}
                      </div>
                    )}

                    {/* Overridden Reason Details */}
                    {isOverridden && f.overrideReason && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                        <strong>Reviewer Override:</strong> {f.overrideReason}
                      </div>
                    )}

                    {/* Actions Toolbar */}
                    {!isApproved ? (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 flex-wrap">
                        {/* Pending Actions */}
                        {!isResolved ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {f.suggestedCorrection && (
                              <button
                                type="button"
                                onClick={() => handleApplyFix(f)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs whitespace-nowrap"
                                title="Auto-apply suggestion to draft copy"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Accept Fix</span>
                              </button>
                            )}

                            {f.suggestedCorrection && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(f)}
                                className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs whitespace-nowrap"
                                title="Modify suggestion before applying"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setRejectModalFinding(f)}
                              className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all whitespace-nowrap"
                              title="Decline this suggestion with a reason"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </div>
                        ) : (
                          /* Resolved State: Undo option */
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-medium">
                              Decision recorded
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUndoDecision(f)}
                              className="text-[11px] text-brand-600 hover:text-brand-800 font-semibold underline flex items-center gap-1"
                              title="Revert decision back to pending"
                            >
                              <Undo2 className="w-3 h-3" />
                              <span>Undo</span>
                            </button>
                          </div>
                        )}

                        {/* Supervisor Override Button */}
                        {(activeRole === 'ADMIN' || activeRole === 'REVIEWER' || activeRole === 'MANAGER') && !isOverridden && (
                          <button
                            type="button"
                            onClick={() => setOverrideModalFinding(f)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap ml-auto"
                          >
                            Override Flag
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic pt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Actions locked upon manager approval</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* New Submission Modal */}
      {showNewModal && (
        <div 
          onClick={() => setShowNewModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="bg-slate-900 p-4 sm:p-5 text-white flex items-center justify-between sticky top-0 z-10 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-500/20 text-brand-400 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">New Content Submission</h3>
                  <p className="text-[11px] text-slate-400 hidden sm:block">Automated brand compliance & consistency review</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowNewModal(false)} 
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center"
                title="Close modal (Esc)"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmission} className="p-4 sm:p-6 space-y-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              {/* File Attachment / Multi-Format Document Intake */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Upload Documents or Images (Optional)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    PDF, DOCX, JPG, PNG (Max 10MB)
                  </span>
                </div>

                {/* Dropzone */}
                <div className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-xl p-4 text-center transition-colors bg-slate-50/50 hover:bg-slate-50 cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp,.txt"
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      Click or drag files here to attach
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Supports <strong className="text-slate-600">.pdf, .docx, .jpg, .png</strong> &bull; Automatic text extraction & WCAG contrast checks
                    </p>
                  </div>
                </div>

                {/* Extraction / Format Error Alert */}
                {fileError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{fileError}</span>
                  </div>
                )}

                {/* Uploaded Files Queue */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {uploadedFiles.map((file, idx) => {
                      const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
                      const isPdf = file.name.toLowerCase().endsWith('.pdf');
                      const altVal = fileAltTexts[file.name] || '';

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isImage ? (
                                <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center">
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : isPdf ? (
                                <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">
                                  {file.name}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {(file.size / 1024).toFixed(0)} KB &bull; {isImage ? 'Image' : isPdf ? 'PDF Document' : 'DOCX Document'}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Image Alt-Text Input for WCAG Accessibility */}
                          {isImage && (
                            <div className="pt-2 border-t border-slate-100 space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-semibold text-slate-600">
                                  Image Alt-Text (WCAG Accessibility)
                                </label>
                                {altVal.trim().length >= 8 ? (
                                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                                    Accessible ✓
                                  </span>
                                ) : altVal.trim().length > 0 ? (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                                    Too brief (&lt; 8 chars)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-medium border border-rose-200">
                                    Missing Alt-Text
                                  </span>
                                )}
                              </div>
                              <input
                                type="text"
                                value={altVal}
                                onChange={(e) =>
                                  setFileAltTexts((prev) => ({
                                    ...prev,
                                    [file.name]: e.target.value,
                                  }))
                                }
                                placeholder="Describe image context for screen readers & accessibility..."
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Draft Copy {uploadedFiles.length > 0 ? '(Optional if text is in uploaded files)' : ''}
                  </label>
                  {uploadedFiles.length > 0 && (
                    <span className="text-[11px] text-brand-600 font-medium">
                      Copy will be auto-extracted from document
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder={
                    uploadedFiles.length > 0
                      ? 'You can leave this empty to auto-extract text from your uploaded file, or paste draft copy here...'
                      : 'Paste marketing copy or text to review...'
                  }
                  className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none leading-relaxed"
                />
              </div>
              <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting || !activeOrg?._id}
                  className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting & Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-brand-200" />
                      <span>Submit & Run Automated Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Override Justification Modal (Blueprint Section 5: Mandatory Reason) */}
      {overrideModalFinding && (
        <div 
          onClick={() => setOverrideModalFinding(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Record Justified Reviewer Override</h3>
              <button
                type="button"
                onClick={() => setOverrideModalFinding(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
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
        <div 
          onClick={() => setRejectModalFinding(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Decline Suggestion</h3>
              <button
                type="button"
                onClick={() => setRejectModalFinding(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
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

      {/* Edit Suggestion Modal */}
      {editModalFinding && (
        <div 
          onClick={() => setEditModalFinding(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit & Customize Fix</h3>
                  <p className="text-[11px] text-slate-500">Modify the suggested wording before applying it to your draft</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalFinding(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Original Flagged Text */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Flagged Text to Replace:
              </label>
              <div className="font-mono text-xs text-rose-800 bg-rose-50/70 p-2.5 rounded-lg border border-rose-200">
                "{editModalFinding.originalText}"
              </div>
            </div>

            {/* AI Recommendation reference */}
            {editModalFinding.suggestedCorrection && (
              <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  AI Suggestion (Reference):
                </span>
                <p className="text-emerald-950 font-medium">"{editModalFinding.suggestedCorrection}"</p>
              </div>
            )}

            {/* Custom Replacement Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Your Custom Replacement Text:
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {editedSuggestionText.length} chars
                </span>
              </div>
              <textarea
                rows={3}
                value={editedSuggestionText}
                onChange={(e) => setEditedSuggestionText(e.target.value)}
                placeholder="Enter customized replacement wording..."
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none leading-relaxed"
                autoFocus
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditModalFinding(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!editedSuggestionText.trim()}
                onClick={handleApplyEditedFix}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Edited Fix to Draft</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
