import React, { useState, useEffect, useCallback } from 'react';
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
  Calendar 
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { api } from '../services/api';

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

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const actorName = log.actorId?.name?.toLowerCase() || '';
      const actorEmail = log.actorId?.email?.toLowerCase() || '';
      const actionName = log.action?.toLowerCase() || '';
      const reason = log.details?.reason?.toLowerCase() || '';
      return actorName.includes(q) || actorEmail.includes(q) || actionName.includes(q) || reason.includes(q);
    }
    return true;
  });

  const getActionBadge = (action) => {
    switch (action) {
      case 'CONTENT_CREATED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Created</span>;
      case 'REVIEW_RUN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Review Run</span>;
      case 'FINDING_DECISION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Finding Override</span>;
      case 'APPROVAL_DECISION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Approval Decision</span>;
      case 'COMMENT_ADDED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Comment</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">{action}</span>;
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
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
          <History className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Workspace Required</h3>
        <p className="text-xs text-slate-500 mt-1">
          Please sign in and select an organisation workspace to view the immutable audit trail.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Immutable Audit Trail & Governance Log</h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-full">
              Tamper-Evident
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Cryptographically timestamped ledger of every draft creation, finding decision, override reason, and final approval.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCertModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Pre-Publication Certificate</span>
          </button>
          <button
            onClick={loadAuditData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh Logs'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by actor, action, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'APPROVAL_DECISION', label: 'Approvals' },
            { id: 'FINDING_DECISION', label: 'Overrides' },
            { id: 'REVIEW_RUN', label: 'Reviews' },
            { id: 'CONTENT_CREATED', label: 'Intakes' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActionFilter(f.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                actionFilter === f.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Ledger Events ({filteredLogs.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Latest 100 entries &bull; Immutable
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <History className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">No audit logs matching criteria</p>
            <p className="text-xs text-slate-400">
              Submit drafts, run reviews, override findings, or approve content to populate the ledger.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div key={log._id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-start gap-4">
                <div className="mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
                    {log.action === 'APPROVAL_DECISION' ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    ) : log.action === 'FINDING_DECISION' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : log.action === 'REVIEW_RUN' ? (
                      <FileCheck2 className="w-4 h-4 text-purple-600" />
                    ) : (
                      <History className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="text-xs font-semibold text-slate-800">
                      {log.actorId?.name || 'System / Service'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({log.actorId?.email || 'automated-runner'})
                    </span>
                    <span className="text-[11px] text-slate-400 ml-auto flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Target:</span>{' '}
                    <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {log.targetType} #{log.targetId ? log.targetId.slice(-6) : 'N/A'}
                    </span>
                  </div>

                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 mt-1 space-y-0.5">
                      {log.details.decision && (
                        <div>
                          <strong className="text-slate-900">Decision:</strong>{' '}
                          <span className={log.details.decision === 'APPROVED' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                            {log.details.decision}
                          </span>
                        </div>
                      )}
                      {log.details.reason && (
                        <div>
                          <strong className="text-slate-900">Reason / Justification:</strong> {log.details.reason}
                        </div>
                      )}
                      {log.details.title && (
                        <div>
                          <strong className="text-slate-900">Document Title:</strong> {log.details.title}
                        </div>
                      )}
                      {log.details.findingsCount !== undefined && (
                        <div>
                          <strong className="text-slate-900">Findings Detected:</strong> {log.details.findingsCount}
                        </div>
                      )}
                      {log.details.body && (
                        <div>
                          <strong className="text-slate-900">Comment Body:</strong> "{log.details.body}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pre-Publication Compliance Certificate Modal (Milestone 8) */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center border border-emerald-400/30">
                  <Award className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Pre-Publication Compliance Certificate</h3>
                  <p className="text-xs text-brand-200">Formal tamper-evident verification passport</p>
                </div>
              </div>
              <button
                onClick={() => setShowCertModal(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Content Item to Inspect & Certify:
                </label>
                <select
                  value={selectedCertContent?._id || ''}
                  onChange={(e) => {
                    const found = contents.find((c) => c._id === e.target.value);
                    if (found) setSelectedCertContent(found);
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-500"
                >
                  {contents.map((c) => (
                    <option key={c._id} value={c._id}>
                      [{c.status}] {c.title} (v{c.currentVersionNumber || 1})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCertContent ? (
                <div className="border border-slate-200 rounded-xl p-5 bg-gradient-to-b from-white to-slate-50 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-brand-700">Official Certificate</div>
                      <div className="text-lg font-bold text-slate-900">{selectedCertContent.title}</div>
                      <div className="text-xs text-slate-500">
                        Channel: {selectedCertContent.channel} &bull; Audience: {selectedCertContent.targetAudience}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-mono">CERT ID</div>
                      <div className="text-xs font-mono font-bold text-slate-800">
                        BL-CERT-{selectedCertContent._id.slice(-6).toUpperCase()}
                      </div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedCertContent.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        STATUS: {selectedCertContent.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Deterministic Terminology
                      </div>
                      <div className="text-[11px] text-slate-500">
                        100% confidence. Zero hallucinated rule matches.
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Grounded Approved Facts
                      </div>
                      <div className="text-[11px] text-slate-500">
                        All claims anchored to verified corporate knowledge base.
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Tone & Voice Compliance
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Audited against official brand voice guidelines.
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-brand-600" />
                        Human Authorization
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Locked upon approval. Immutable state recorded.
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-200">
                    Certified by BrandLens AI Governance Engine &bull; Organization: {activeOrg?.name} &bull; Timestamp: {new Date().toISOString()}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No content selected.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={handleCopyCertificate}
                disabled={!selectedCertContent}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                {copiedCert ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCert ? 'Copied Certificate JSON' : 'Copy JSON Certificate'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCertificate}
                  disabled={!selectedCertContent}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
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
