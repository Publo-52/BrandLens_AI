import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Plus, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Palette, 
  Layers, 
  RefreshCw, 
  Calendar, 
  Tag, 
  Check, 
  FileText,
  X 
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { api } from '../services/api';
import { ContrastChecker } from '../components/common/ContrastChecker';

const CATEGORIES = ['ALL', 'TONE', 'MESSAGING', 'VISUAL', 'ACCESSIBILITY', 'LEGAL', 'OTHER'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function KnowledgeBasePage() {
  const { user, token, activeOrg, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState('guidelines'); // 'guidelines' | 'facts' | 'terminology' | 'assets'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Data states
  const [guidelines, setGuidelines] = useState([]);
  const [facts, setFacts] = useState([]);
  const [terminology, setTerminology] = useState([]);
  const [assets, setAssets] = useState([]);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal / Add form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [guidelineForm, setGuidelineForm] = useState({
    title: '',
    category: 'TONE',
    ruleText: '',
    severity: 'MEDIUM',
    sourceLocation: '',
  });

  const [factForm, setFactForm] = useState({
    statement: '',
    sourceReference: '',
    product: 'All',
  });

  const [termForm, setTermForm] = useState({
    preferredTerm: '',
    bannedTerms: '',
    replacement: '',
    explanation: '',
    scope: 'General',
  });

  const [assetForm, setAssetForm] = useState({
    name: '',
    type: 'PALETTE',
    hexColors: '#6366f1, #0f172a, #fafafc',
    clearSpaceRule: '',
  });

  const canManage = activeRole === 'ADMIN' || activeRole === 'MANAGER';

  const loadData = useCallback(async () => {
    if (!activeOrg?._id || !token) return;
    setLoading(true);
    setError(null);
    try {
      const [gRes, fRes, tRes, aRes] = await Promise.allSettled([
        api.getGuidelines(activeOrg._id, token),
        api.getFacts(activeOrg._id, token),
        api.getTerminology(activeOrg._id, token),
        api.getAssets(activeOrg._id, token),
      ]);
      setGuidelines(gRes.status === 'fulfilled' ? gRes.value?.guidelines || [] : []);
      setFacts(fRes.status === 'fulfilled' ? fRes.value?.facts || [] : []);
      setTerminology(tRes.status === 'fulfilled' ? tRes.value?.rules || [] : []);
      setAssets(aRes.status === 'fulfilled' ? aRes.value?.assets || [] : []);

      const rejected = [gRes, fRes, tRes, aRes].filter((r) => r.status === 'rejected');
      if (rejected.length === 4) {
        setError(rejected[0].reason?.message || 'Failed to connect to brand knowledge services');
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

  // Esc key listener to close modal without page refresh
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showAddModal) {
        setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  const handleSeedDemo = async () => {
    if (!activeOrg?._id || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.seedDemoBrandPack(activeOrg._id, token);
      setSuccessMsg(`Brand Pack Seeded! Added ${res.seeded?.guidelines || 0} guidelines, ${res.seeded?.facts || 0} facts, ${res.seeded?.terminology || 0} terminology rules.`);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuideline = async (e) => {
    e.preventDefault();
    if (!activeOrg?._id || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createGuideline(activeOrg._id, guidelineForm, token);
      setSuccessMsg('Guideline rule added successfully!');
      setShowAddModal(false);
      setGuidelineForm({ title: '', category: 'TONE', ruleText: '', severity: 'MEDIUM', sourceLocation: '' });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create guideline');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFact = async (e) => {
    e.preventDefault();
    if (!activeOrg?._id || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createFact(
        activeOrg._id,
        {
          statement: factForm.statement,
          sourceReference: factForm.sourceReference,
          applicability: { product: factForm.product, region: 'Global', channel: 'All' },
        },
        token
      );
      setSuccessMsg('Approved fact added to truth library!');
      setShowAddModal(false);
      setFactForm({ statement: '', sourceReference: '', product: 'All' });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create fact');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTerm = async (e) => {
    e.preventDefault();
    if (!activeOrg?._id || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      const banned = termForm.bannedTerms
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await api.createTerminology(
        activeOrg._id,
        {
          preferredTerm: termForm.preferredTerm,
          bannedTerms: banned,
          replacement: termForm.replacement || termForm.preferredTerm,
          explanation: termForm.explanation,
          scope: termForm.scope,
        },
        token
      );
      setSuccessMsg('Terminology rule created!');
      setShowAddModal(false);
      setTermForm({ preferredTerm: '', bannedTerms: '', replacement: '', explanation: '', scope: 'General' });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create terminology rule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    if (!activeOrg?._id || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      const hexList = assetForm.hexColors
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await api.createAsset(
        activeOrg._id,
        {
          name: assetForm.name,
          type: assetForm.type,
          metadata: {
            hexColors: hexList,
            clearSpaceRule: assetForm.clearSpaceRule,
          },
        },
        token
      );
      setSuccessMsg('Brand visual asset registered!');
      setShowAddModal(false);
      setAssetForm({ name: '', type: 'PALETTE', hexColors: '#0c8ee9, #0259a1, #072849', clearSpaceRule: '' });
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGuidelines = useMemo(
    () => guidelines.filter((g) => selectedCategory === 'ALL' || g.category === selectedCategory),
    [guidelines, selectedCategory]
  );

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'LOW':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900">Brand Knowledge Base</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              Source of Truth
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Versioned brand guidelines, approved factual claims, terminology rules, and asset tokens.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            title="Reload data"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>

          {canManage && (
            <button
              onClick={handleSeedDemo}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Seed Demo Pack</span>
            </button>
          )}

          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add {activeTab.slice(0, -1)}</span>
            </button>
          )}
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

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 text-xs font-bold w-full overflow-x-auto touch-scroll no-scrollbar">
        <button
          onClick={() => setActiveTab('guidelines')}
          className={`flex-1 justify-center px-4 py-2 rounded-xl transition-all duration-150 flex items-center gap-2 shrink-0 ${
            activeTab === 'guidelines'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span>Brand Guidelines</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
            activeTab === 'guidelines' ? 'bg-brand-50 text-brand-700' : 'bg-slate-200/70 text-slate-600'
          }`}>
            {guidelines.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('facts')}
          className={`flex-1 justify-center px-4 py-2 rounded-xl transition-all duration-150 flex items-center gap-2 shrink-0 ${
            activeTab === 'facts'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span>Approved Facts</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
            activeTab === 'facts' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200/70 text-slate-600'
          }`}>
            {facts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('terminology')}
          className={`flex-1 justify-center px-4 py-2 rounded-xl transition-all duration-150 flex items-center gap-2 shrink-0 ${
            activeTab === 'terminology'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span>Terminology Rules</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
            activeTab === 'terminology' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/70 text-slate-600'
          }`}>
            {terminology.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`flex-1 justify-center px-4 py-2 rounded-xl transition-all duration-150 flex items-center gap-2 shrink-0 ${
            activeTab === 'assets'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span>Visual Brand Assets</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
            activeTab === 'assets' ? 'bg-purple-50 text-purple-700' : 'bg-slate-200/70 text-slate-600'
          }`}>
            {assets.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Guidelines */}
      {activeTab === 'guidelines' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-medium">Category:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGuidelines.length > 0 ? (
              filteredGuidelines.map((g) => (
                <div key={g._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                        {g.category}
                      </span>
                      <h4 className="font-semibold text-slate-900 text-sm mt-1.5">{g.title}</h4>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getSeverityBadge(g.severity)}`}>
                        {g.severity}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        v{g.version}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    "{g.ruleText}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span className="truncate max-w-[220px]">
                      Source: {g.sourceLocation || 'Official Guideline'}
                    </span>
                    <span>Status: {g.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-14 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-2.5">
                <div className="w-11 h-11 rounded-2xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-600 mx-auto">
                  <BookOpen className="w-5 h-5 stroke-[1.9]" />
                </div>
                <p className="text-sm font-semibold text-slate-800">No guidelines found in this category</p>
                <p className="text-xs text-slate-400">Click &ldquo;Seed Demo Pack&rdquo; above to automatically populate realistic rules.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Approved Facts */}
      {activeTab === 'facts' && (
        <div className="space-y-4">
          <div className="bg-blue-50/60 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <FileText className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <strong>Ground Truth Verification Engine:</strong> During review, AI compares claims in submitted drafts only against these approved statements. Any claim without an approved source is clearly reported as <em>"Unsupported"</em> without guessing citations.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facts.length > 0 ? (
              facts.map((f) => (
                <div key={f._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Approved Truth
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">v{f.version}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    "{f.statement}"
                  </p>
                  <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reference:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[200px]">{f.sourceReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Applicability:</span>
                      <span>{f.applicability?.product || 'All Products'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-14 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-2.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 mx-auto">
                  <FileText className="w-5 h-5 stroke-[1.9]" />
                </div>
                <p className="text-sm font-semibold text-slate-800">No approved facts defined yet</p>
                <p className="text-xs text-slate-400">Click &ldquo;Seed Demo Pack&rdquo; above to populate.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Terminology */}
      {activeTab === 'terminology' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
            <Tag className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <strong>Deterministic Check Dictionary:</strong> When content contains any of the banned terms, BrandLens AI automatically flags them with 100% confidence and suggests the approved replacement.
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Preferred Term</th>
                  <th className="py-3 px-4">Banned / Discouraged Terms</th>
                  <th className="py-3 px-4">Suggested Replacement</th>
                  <th className="py-3 px-4">Explanation / Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {terminology.length > 0 ? (
                  terminology.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-emerald-700 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{t.preferredTerm}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {t.bannedTerms.map((b, i) => (
                            <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[11px] font-medium">
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{t.replacement}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{t.explanation || t.scope}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No terminology rules defined yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Assets & Palettes */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          <ContrastChecker />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assets.length > 0 ? (
              assets.map((a) => (
                <div key={a._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {a.type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">v{a.version}</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm">{a.name}</h4>

                  {/* Palette Swatches */}
                  {a.type === 'PALETTE' && a.metadata?.hexColors && (
                    <div className="space-y-2 pt-2">
                      <div className="flex h-10 rounded-lg overflow-hidden border border-slate-200 shadow-inner">
                        {a.metadata.hexColors.map((hex, i) => (
                          <div key={i} className="flex-1" style={{ backgroundColor: hex }} title={hex} />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-slate-500">
                        {a.metadata.hexColors.map((hex, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-50 rounded border border-slate-200">
                            {hex}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Logo Rules */}
                  {a.type === 'LOGO' && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
                      <div className="font-semibold text-slate-800 mb-1">Clear Space Rule:</div>
                      <p>{a.metadata?.clearSpaceRule || 'Standard margins apply.'}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-14 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-2.5">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 mx-auto">
                  <Palette className="w-5 h-5 stroke-[1.9]" />
                </div>
                <p className="text-sm font-semibold text-slate-800">No brand visual assets registered yet</p>
                <p className="text-xs text-slate-400">Click &ldquo;Seed Demo Pack&rdquo; above to populate.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div 
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="bg-slate-900 p-4 sm:p-5 text-white flex items-center justify-between sticky top-0 z-10 border-b border-slate-800">
              <h3 className="font-bold text-sm sm:text-base">Add New {activeTab.slice(0, -1)}</h3>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)} 
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center"
                title="Close modal (Esc)"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {activeTab === 'guidelines' && (
                <form onSubmit={handleCreateGuideline} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={guidelineForm.title}
                      onChange={(e) => setGuidelineForm({ ...guidelineForm, title: e.target.value })}
                      placeholder="e.g. Transparent Pricing Disclaimer"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                      <select
                        value={guidelineForm.category}
                        onChange={(e) => setGuidelineForm({ ...guidelineForm, category: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      >
                        {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Severity</label>
                      <select
                        value={guidelineForm.severity}
                        onChange={(e) => setGuidelineForm({ ...guidelineForm, severity: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      >
                        {SEVERITIES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Rule Text</label>
                    <textarea
                      required
                      rows={3}
                      value={guidelineForm.ruleText}
                      onChange={(e) => setGuidelineForm({ ...guidelineForm, ruleText: e.target.value })}
                      placeholder="Explain the specific brand governance rule..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Source Reference</label>
                    <input
                      type="text"
                      value={guidelineForm.sourceLocation}
                      onChange={(e) => setGuidelineForm({ ...guidelineForm, sourceLocation: e.target.value })}
                      placeholder="e.g. Brand Voice Guide 2026, Section 2"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="w-full sm:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      {submitting ? 'Saving...' : 'Add Guideline'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'facts' && (
                <form onSubmit={handleCreateFact} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Approved Factual Statement</label>
                    <textarea
                      required
                      rows={3}
                      value={factForm.statement}
                      onChange={(e) => setFactForm({ ...factForm, statement: e.target.value })}
                      placeholder="e.g. Our server architecture delivers 99.9% verified uptime."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Source Citation Document</label>
                    <input
                      type="text"
                      required
                      value={factForm.sourceReference}
                      onChange={(e) => setFactForm({ ...factForm, sourceReference: e.target.value })}
                      placeholder="e.g. Architecture SLA Whitepaper 2026, Sec 3"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Product Scope</label>
                    <input
                      type="text"
                      value={factForm.product}
                      onChange={(e) => setFactForm({ ...factForm, product: e.target.value })}
                      placeholder="e.g. Cloud Service, Enterprise, All"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="w-full sm:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      {submitting ? 'Saving...' : 'Add Approved Fact'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'terminology' && (
                <form onSubmit={handleCreateTerm} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Term</label>
                    <input
                      type="text"
                      required
                      value={termForm.preferredTerm}
                      onChange={(e) => setTermForm({ ...termForm, preferredTerm: e.target.value })}
                      placeholder="e.g. NovaTech Cloud"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Banned Terms (comma separated)</label>
                    <input
                      type="text"
                      required
                      value={termForm.bannedTerms}
                      onChange={(e) => setTermForm({ ...termForm, bannedTerms: e.target.value })}
                      placeholder="e.g. 100% risk-free, zero risk, bulletproof"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Approved Replacement</label>
                    <input
                      type="text"
                      value={termForm.replacement}
                      onChange={(e) => setTermForm({ ...termForm, replacement: e.target.value })}
                      placeholder="e.g. enterprise-grade reliability"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="w-full sm:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      {submitting ? 'Saving...' : 'Add Terminology Rule'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'assets' && (
                <form onSubmit={handleCreateAsset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Asset Name</label>
                    <input
                      type="text"
                      required
                      value={assetForm.name}
                      onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                      placeholder="e.g. Primary Corporate Palette"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">HEX Color Codes (comma-separated)</label>
                    <input
                      type="text"
                      value={assetForm.hexColors}
                      onChange={(e) => setAssetForm({ ...assetForm, hexColors: e.target.value })}
                      placeholder="#0c8ee9, #0259a1, #072849, #ffffff"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="w-full sm:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      {submitting ? 'Saving...' : 'Register Asset'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
