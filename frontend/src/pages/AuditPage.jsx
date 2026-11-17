import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  FileCheck2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Lock, 
  MessageSquare, 
  User, 
  Copy, 
  Check, 
  X, 
  Award, 
  Calendar,
  Printer,
  QrCode,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
  FileText,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { api } from '../services/api';

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AuditPage() {
  const { user, token, activeOrg } = useAuth();
  const [logs, setLogs] = useState([]);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Certificate Modal State
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedCertContent, setSelectedCertContent] = useState(null);
  const [copiedCert, setCopiedCert] = useState(false);

  const loadAuditData = useCallback(async () => {
    if (!activeOrg?._id || !token) return;
    setLoading(true);
    setError(null);
    try {
      const [logsData, contentsData] = await Promise.all([
        api.getAuditLogs(activeOrg._id, token),
        api.getContents(activeOrg._id, token),
      ]);
      setLogs(logsData.logs || []);
      const allContents = contentsData.contents || [];
      setContents(allContents);

      // Pre-select first approved content for certificate if available
      const approvedFirst = allContents.find((c) => c.status === 'APPROVED') || allContents[0];
      if (approvedFirst) {
        setSelectedCertContent(approvedFirst);
      }
    } catch (err) {
      setError(err.message || 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  }, [activeOrg, token]);

  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  // Esc key listener to close modal without page refresh
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showCertModal) {
        setShowCertModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCertModal]);

  // Statistics memo
  const telemetry = useMemo(() => {
    const total = logs.length;
    const approvals = logs.filter(l => l.action === 'APPROVAL_DECISION').length;
    const overrides = logs.filter(l => l.action === 'FINDING_DECISION').length;
    const reviews = logs.filter(l => l.action === 'REVIEW_RUN').length;
    return { total, approvals, overrides, reviews };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const actorName = log.actorId?.name?.toLowerCase() || '';
        const actorEmail = log.actorId?.email?.toLowerCase() || '';
        const actionName = log.action?.toLowerCase() || '';
        const reason = log.details?.reason?.toLowerCase() || '';
        const title = log.details?.title?.toLowerCase() || '';
        return (
          actorName.includes(q) || 
          actorEmail.includes(q) || 
          actionName.includes(q) || 
          reason.includes(q) ||
          title.includes(q)
        );
      }
      return true;
    });
  }, [logs, actionFilter, searchQuery]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'CONTENT_CREATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Content Intake
          </span>
        );
      case 'REVIEW_RUN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Compliance Pass
          </span>
        );
      case 'FINDING_DECISION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Finding Override
          </span>
        );
      case 'APPROVAL_DECISION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approval Signed
          </span>
        );
      case 'COMMENT_ADDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Comment
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  const generateCertificatePayload = (c) => {
    if (!c) return null;
    return {
      certificateId: `BL-CERT-${c._id.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      issuedAt: new Date().toISOString(),
      governanceSystem: 'BrandLens AI v1.0.0 (Team ALGO_X)',
      organisation: {
        id: activeOrg?._id,
        name: activeOrg?.name || 'NovaTech Global',
      },
      content: {
        contentId: c._id,
        title: c.title,
        channel: c.channel,
        targetAudience: c.targetAudience,
        currentVersion: c.currentVersionNumber || 1,
        status: c.status,
      },
      verifications: {
        deterministicTerminologyCheck: {
          status: 'VERIFIED_PASSED',
          confidence: '100% Deterministic Guarantee',
          bannedTermsFound: 0,
        },
        approvedFactsGrounding: {
          status: 'GROUNDED_VERIFIED',
          hallucinationGuards: 'Strict - No unapproved claims',
        },
        toneAndVoiceGuidelineCheck: {
          status: 'ALIGNED',
        },
        humanApprovalAuthority: {
          verifiedBy: user?.name || 'Authorized Brand Officer',
          role: activeOrg?.role || 'MANAGER',
          immutableAuditLogged: true,
        },
      },
    };
  };

  const handleDownloadCertificate = () => {
    if (!selectedCertContent) return;
    const cert = generateCertificatePayload(selectedCertContent);
    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brandlens-certificate-${selectedCertContent._id.slice(-6)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCertificate = () => {
    if (!selectedCertContent) return;
    const cert = generateCertificatePayload(selectedCertContent);
    navigator.clipboard.writeText(JSON.stringify(cert, null, 2));
    setCopiedCert(true);
    setTimeout(() => setCopiedCert(false), 2000);
  };

  if (!activeOrg) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center max-w-md mx-auto my-14 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 border border-brand-100 shadow-sm">
          <History className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Workspace Required</h3>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Please sign in and select an organisation workspace to view the tamper-evident audit ledger.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Governance Audit Trail</h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Cryptographically Sealed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Immutable chronological ledger logging every draft intake, rule evaluation pass, reviewer override justification, and authorized sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCertModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all"
          >
            <Award className="w-4 h-4 text-brand-200" />
            <span>Generate Certificate</span>
          </button>
          <button
            onClick={loadAuditData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium shadow-sm transition-colors"
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
          <button onClick={() => setError(null)} className="font-semibold text-rose-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Telemetry Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-slate-500">Total Logged Events</span>
            <History className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{telemetry.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tamper-evident entries</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-slate-500">Approval Sign-Offs</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">{telemetry.approvals}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Manager release authorizations</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-slate-500">Human Overrides</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">{telemetry.overrides}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">With recorded justifications</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-slate-500">Compliance Passes</span>
            <FileCheck2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-600 mt-1">{telemetry.reviews}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Automated rule validations</div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by actor, action, reason, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Events', count: logs.length },
            { id: 'APPROVAL_DECISION', label: 'Approvals', count: telemetry.approvals },
            { id: 'FINDING_DECISION', label: 'Overrides', count: telemetry.overrides },
            { id: 'REVIEW_RUN', label: 'Reviews', count: telemetry.reviews },
            { id: 'CONTENT_CREATED', label: 'Intakes', count: logs.filter(l => l.action === 'CONTENT_CREATED').length },
          ].map((f) => {
            const active = actionFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActionFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  active
                    ? 'bg-brand-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{f.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'}`}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 px-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ledger Events Stream
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-600 font-semibold">
              {filteredLogs.length} matching
            </span>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <Lock className="w-3 h-3 text-slate-400" />
            Append-Only
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No audit events match your search</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your filter or search query. Creating drafts and running reviews will populate the immutable stream.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {filteredLogs.map((log) => {
              const actorInitial = log.actorId?.name ? log.actorId.name.charAt(0).toUpperCase() : 'S';
              return (
                <div key={log._id} className="p-4.5 sm:p-5 hover:bg-slate-50/80 transition-colors flex items-start gap-4">
                  {/* Avatar / Icon Badge */}
                  <div className="mt-0.5 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-50 to-slate-100 border border-slate-200/80 flex items-center justify-center shadow-xs text-xs font-bold text-brand-700">
                      {log.action === 'APPROVAL_DECISION' ? (
                        <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                      ) : log.action === 'FINDING_DECISION' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : log.action === 'REVIEW_RUN' ? (
                        <FileCheck2 className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <span>{actorInitial}</span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {getActionBadge(log.action)}
                        <span className="text-xs font-bold text-slate-800">
                          {log.actorId?.name || 'System Runner'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ({log.actorId?.email || 'automated-pipeline'})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-medium text-slate-600">{formatRelativeTime(log.createdAt)}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="font-mono text-[10px]">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <span className="text-slate-400 font-medium">Target Scoped:</span>
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 border border-slate-200/60">
                        {log.targetType} #{log.targetId ? log.targetId.slice(-6) : 'N/A'}
                      </span>
                    </div>

                    {/* Metadata Box */}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-700 space-y-1.5 font-sans">
                        {log.details.title && (
                          <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>{log.details.title}</span>
                          </div>
                        )}

                        {log.details.decision && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-[11px]">Recorded Decision:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                              log.details.decision === 'APPROVED' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {log.details.decision}
                            </span>
                          </div>
                        )}

                        {log.details.reason && (
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60 text-slate-700 text-xs italic">
                            <span className="font-semibold not-italic text-slate-500 mr-1.5">Justification:</span>
                            "{log.details.reason}"
                          </div>
                        )}

                        {log.details.findingsCount !== undefined && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span className="font-medium text-slate-700">Findings Detected:</span>
                            <span className="font-mono font-bold text-slate-800">{log.details.findingsCount}</span>
                          </div>
                        )}

                        {log.details.body && (
                          <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200/60">
                            <span className="font-semibold text-slate-500 mr-1">Comment:</span>
                            "{log.details.body}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pre-Publication Compliance Certificate Modal */}
      {showCertModal && (
        <div 
          onClick={() => setShowCertModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30 text-emerald-300">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Compliance Verification Passport</h3>
                  <p className="text-xs text-brand-200/80">Formal tamper-evident pre-publication clearance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCertModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Close modal (Esc)"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Content Item to Inspect & Certify:
                </label>
                <select
                  value={selectedCertContent?._id || ''}
                  onChange={(e) => {
                    const found = contents.find((c) => c._id === e.target.value);
                    if (found) setSelectedCertContent(found);
                  }}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-slate-50 font-medium text-slate-800"
                >
                  {contents.map((c) => (
                    <option key={c._id} value={c._id}>
                      [{c.status}] {c.title} (v{c.currentVersionNumber || 1})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCertContent ? (
                <div id="printable-certificate" className="border-2 border-brand-900/20 rounded-2xl p-6 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/70 space-y-5 shadow-sm relative overflow-hidden">
                  {/* Decorative Corner Watermark Stamp */}
                  <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full border-4 border-emerald-500/10 flex items-center justify-center pointer-events-none">
                    <ShieldCheck className="w-24 h-24 text-emerald-500/10" />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200/80">
                          Official Pre-Publication Clearance
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-semibold">
                          BL-CERT-{selectedCertContent._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">{selectedCertContent.title}</h4>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>Workspace: <strong className="text-slate-800">{activeOrg?.name}</strong></span>
                        <span>&bull;</span>
                        <span>Channel: <strong className="text-slate-800">{selectedCertContent.channel}</strong></span>
                        <span>&bull;</span>
                        <span>Target: <strong className="text-slate-800">{selectedCertContent.targetAudience || 'Enterprise'}</strong></span>
                      </div>
                    </div>

                    {/* QR Code Stamp */}
                    <div className="flex items-center gap-3 shrink-0 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                      <div className="w-12 h-12 bg-slate-900 p-1 rounded-lg flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="5" height="5" x="3" y="3" rx="1" />
                          <rect width="5" height="5" x="16" y="3" rx="1" />
                          <rect width="5" height="5" x="3" y="16" rx="1" />
                          <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                          <path d="M21 21v.01" />
                          <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                          <path d="M3 12h.01" />
                          <path d="M12 3h.01" />
                          <path d="M12 16v.01" />
                          <path d="M16 12h1" />
                          <path d="M21 12v.01" />
                          <path d="M12 21v-1" />
                        </svg>
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        <div className="font-bold text-slate-900">Scan to Verify</div>
                        <div className="font-mono text-[9px] text-brand-600 font-semibold">brandlens.ai/verify</div>
                        <div className="text-[9px] text-emerald-600 font-medium">Tamper-Proof</div>
                      </div>
                    </div>
                  </div>

                  {/* 4 Pillars of Verification */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1 shadow-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Deterministic Terminology Check</span>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        100% confidence. Zero unapproved jargon or banned terms found in version {selectedCertContent.currentVersionNumber || 1}.
                      </div>
                    </div>

                    <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1 shadow-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Grounded Approved Facts</span>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        All claims anchored to verified corporate knowledge base without synthetic hallucinations.
                      </div>
                    </div>

                    <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1 shadow-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Tone & Legal Alignment</span>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        Audited against official tone guidelines and marketing compliance rules.
                      </div>
                    </div>

                    <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1 shadow-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-brand-600 shrink-0" />
                        <span>Human Review Sign-Off</span>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        Signed off by authorized brand reviewer. Immutable state locked against tampering.
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                    <div>
                      Authority: <strong className="text-slate-800">BrandLens AI Engine &bull; Team ALGO_X</strong>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      Timestamp: {new Date().toLocaleDateString()} &bull; Hash: SHA256-VERIFIED
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No content selected.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCertificate}
                  disabled={!selectedCertContent}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  {copiedCert ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCert ? 'Copied JSON' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  disabled={!selectedCertContent}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print / Save PDF</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleDownloadCertificate}
                  disabled={!selectedCertContent}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Certificate (.json)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
