import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Check,
  X,
  BookOpen,
  Award,
  FileCheck2,
  GitCompare,
  Lock,
  Users,
  BarChart3,
  ChevronDown,
  Menu,
  Shield,
  Zap,
  Phone,
  Eye,
  Edit3,
  Layers,
  Building2,
  RotateCcw,
  CheckSquare,
  ExternalLink,
  Sliders,
  Scale,
  BadgeCheck,
  Search,
  FileText
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

const HERO_SAMPLES = [
  {
    id: 'sample-1',
    name: 'NovaTech Cloud Launch Draft.docx',
    channel: 'Social Media & Web',
    score: 94,
    textPrefix: 'Experience ',
    flaggedWord: 'Nova Cloud',
    textSuffix: ' today! We deliver enterprise high availability with automated scheduled backups across regions.',
    ruleTitle: 'Banned Colloquialism: Single camelCase Name Required',
    citation: 'NovaTech Voice & Messaging Guide 2026, Section 2.1',
    explanation: '"Nova Cloud" is a discouraged colloquialism. The brand name must always be formatted as "NovaTech Cloud".',
    suggestedFix: 'NovaTech Cloud',
    verifiedFact: 'Automated scheduled backups with multi-region redundancy (Architecture Spec 2026, Sec 4.1)',
  },
  {
    id: 'sample-2',
    name: 'Enterprise SLA Overview.pdf',
    channel: 'Sales Collateral',
    score: 88,
    textPrefix: 'Sign up for NovaTech Cloud today! We deliver ',
    flaggedWord: '100% risk-free uptime guarantee',
    textSuffix: ' with automated regional failover for mission-critical infrastructure.',
    ruleTitle: 'Unsupported Absolute Claim (Overpromise)',
    citation: 'NovaTech Master Services Agreement 2026, SLA Appendix A',
    explanation: 'Absolute "100% risk-free" claims are legally unverified. Replace with our contractually backed SLA metric.',
    suggestedFix: 'guaranteed 99.9% uptime SLA',
    verifiedFact: 'NovaTech Enterprise Tier includes verified 99.9% uptime Service Level Agreement (SLA Appendix A)',
  },
];

export function LandingPage({ onNavigate, onDemoLogin }) {
  const { user, loginWithDemoRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [demoRoleLoading, setDemoRoleLoading] = useState(false);

  // Hero interactive simulator state
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [previewActionStatus, setPreviewActionStatus] = useState(null); // 'ACCEPTED' | 'EDITED' | 'REJECTED' | null
  const [customEditText, setCustomEditText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Before vs After interactive comparison state
  const [comparisonMode, setComparisonMode] = useState('governed'); // 'raw' | 'governed'

  const activeSample = HERO_SAMPLES[selectedSampleIndex];

  // Smooth scroll-reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleScrollTo = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleQuickDemo = async (role = 'ADMIN') => {
    setDemoRoleLoading(true);
    try {
      if (onDemoLogin) {
        await onDemoLogin(role);
      } else if (loginWithDemoRole) {
        await loginWithDemoRole(role);
        if (onNavigate) onNavigate('app');
      }
    } catch (err) {
      console.warn('Demo login error:', err.message);
      if (onNavigate) onNavigate('login');
    } finally {
      setDemoRoleLoading(false);
    }
  };

  const triggerScanAnimation = (index) => {
    setSelectedSampleIndex(index);
    setIsScanning(true);
    setPreviewActionStatus(null);
    setIsEditing(false);
    setTimeout(() => {
      setIsScanning(false);
    }, 450);
  };

  const getDisplayedFlaggedText = () => {
    if (previewActionStatus === 'ACCEPTED') return activeSample.suggestedFix;
    if (previewActionStatus === 'EDITED') return customEditText || activeSample.suggestedFix;
    return activeSample.flaggedWord;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP STICKY NAVBAR                                                  */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0f2744]/95 backdrop-blur-md border-b border-slate-700/60 transition-all shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand logo + v1.0 badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleScrollTo('hero')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 via-teal-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-teal-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105 shrink-0">
                <ShieldCheck className="w-5 h-5 text-white stroke-[2.2]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">
                  BrandLens AI
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                  v1.0
                </span>
              </div>
            </button>
          </div>

          {/* Center Links (Desktop Smooth Scroll) */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => handleScrollTo('how-it-works')}
              className="text-xs font-semibold text-slate-300 hover:text-teal-300 transition-colors focus:outline-none"
            >
              How It Works
            </button>
            <button
              onClick={() => handleScrollTo('features')}
              className="text-xs font-semibold text-slate-300 hover:text-teal-300 transition-colors focus:outline-none"
            >
              Features
            </button>
            <button
              onClick={() => handleScrollTo('comparison')}
              className="text-xs font-semibold text-slate-300 hover:text-teal-300 transition-colors focus:outline-none"
            >
              Governance Comparison
            </button>
            <button
              onClick={() => handleScrollTo('faq')}
              className="text-xs font-semibold text-slate-300 hover:text-teal-300 transition-colors focus:outline-none"
            >
              FAQ
            </button>
          </nav>

          {/* Right CTA buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <button
                onClick={() => onNavigate('app')}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-teal-900/30 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 border border-slate-600 hover:border-teal-400 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all hover:bg-white/5"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-teal-900/30 transition-all hover:scale-[1.02] flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden px-4 pt-2 pb-5 bg-[#0f2744] border-b border-slate-700 space-y-3 animate-in fade-in duration-150">
            <button
              onClick={() => handleScrollTo('how-it-works')}
              className="w-full text-left py-2 text-xs font-semibold text-slate-300 hover:text-teal-300"
            >
              How It Works
            </button>
            <button
              onClick={() => handleScrollTo('features')}
              className="w-full text-left py-2 text-xs font-semibold text-slate-300 hover:text-teal-300"
            >
              Features
            </button>
            <button
              onClick={() => handleScrollTo('comparison')}
              className="w-full text-left py-2 text-xs font-semibold text-slate-300 hover:text-teal-300"
            >
              Governance Comparison
            </button>
            <button
              onClick={() => handleScrollTo('faq')}
              className="w-full text-left py-2 text-xs font-semibold text-slate-300 hover:text-teal-300"
            >
              FAQ
            </button>
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('app');
                  }}
                  className="w-full py-2.5 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs text-center flex items-center justify-center gap-2"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('login');
                    }}
                    className="w-full py-2 border border-slate-600 text-slate-200 rounded-xl text-xs font-semibold text-center"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate('signup');
                    }}
                    className="w-full py-2 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 2. HERO SECTION (Above the Fold)                                      */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-[#0f2744] via-[#0c2037] to-[#071322] text-white border-b border-slate-800/80"
      >
        {/* Subtle Ambient Radial Glows & SVG Grid Texture */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Headline, Subtext & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-semibold shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
                </span>
                <span>Pre-Publication Brand Governance</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
                Check every draft against your brand rules—
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-200 to-teal-400 block mt-1.5">
                  before you publish.
                </span>
              </h1>

              {/* 2-line Subtext */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                BrandLens AI checks marketing, product, and sales copy against approved guidelines, corporate facts, and terminology with exact source citations—keeping human editors in full control.
              </p>

              {/* Primary CTAs right at the top */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-teal-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 active:scale-95 border border-slate-600 hover:border-slate-400 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  Sign In
                </button>

                {/* Subtle 1-Click Judge Demo link */}
                <button
                  type="button"
                  onClick={() => handleQuickDemo('ADMIN')}
                  disabled={demoRoleLoading}
                  className="inline-flex items-center gap-1.5 text-xs text-teal-300 hover:text-teal-200 font-medium underline underline-offset-4 decoration-teal-500/50 hover:decoration-teal-400 transition-colors py-2 px-1 focus:outline-none"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                  <span>{demoRoleLoading ? 'Loading Judge Demo...' : '1-Click Judge Demo'}</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>100% Deterministic RegEx Guard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Zero-Hallucination Citations</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Multi-Tenant RBAC</span>
                </div>
              </div>
            </div>

            {/* Right Column: Clean Interactive Hero Product Console */}
            <div className="lg:col-span-5">
              <div className="relative group">
                {/* Glow behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/30 to-indigo-500/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />

                <div className="relative bg-[#0c1f35]/95 border border-teal-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4 text-left">
                  {/* Console Header Bar with Sample Selector Tabs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 ml-1">
                        Live Review Studio
                      </span>
                    </div>

                    {/* Interactive Sample Switcher */}
                    <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                      {HERO_SAMPLES.map((s, idx) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => triggerScanAnimation(idx)}
                          className={`px-2 py-1 rounded transition-colors ${
                            selectedSampleIndex === idx
                              ? 'bg-teal-500 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Draft {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Document Meta Row */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                      <span className="font-semibold text-slate-200 truncate">
                        {activeSample.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      {activeSample.score}% Score
                    </span>
                  </div>

                  {/* Sample content text with animated scanning overlay */}
                  <div className="relative p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed overflow-hidden">
                    {isScanning && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-400/20 to-transparent animate-pulse" />
                    )}
                    <span>{activeSample.textPrefix}</span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded transition-all duration-300 ${
                        previewActionStatus === 'ACCEPTED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : previewActionStatus === 'EDITED'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : previewActionStatus === 'REJECTED'
                          ? 'line-through bg-slate-800 text-slate-400'
                          : 'bg-rose-500/20 text-rose-300 border-b-2 border-rose-400'
                      }`}
                    >
                      {getDisplayedFlaggedText()}
                    </span>
                    <span>{activeSample.textSuffix}</span>
                  </div>

                  {/* Finding callout card */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Deterministic Guard
                        </span>
                        <span className="text-[10px] text-rose-400 font-semibold uppercase">
                          High Severity
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">100% Precision</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-slate-300">
                        Rule Citation: <span className="text-teal-300">{activeSample.citation}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {activeSample.explanation}
                      </p>
                    </div>

                    {/* Custom Edit Inline Input */}
                    {isEditing && (
                      <div className="pt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={customEditText}
                          onChange={(e) => setCustomEditText(e.target.value)}
                          placeholder="Type custom replacement..."
                          className="flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewActionStatus('EDITED');
                            setIsEditing(false);
                          }}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    {/* Action Pills */}
                    {!isEditing && (
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewActionStatus('ACCEPTED');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                            previewActionStatus === 'ACCEPTED'
                              ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Accept ("{activeSample.suggestedFix}")</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(true);
                            setCustomEditText(activeSample.suggestedFix);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                            previewActionStatus === 'EDITED'
                              ? 'bg-indigo-500 text-white ring-2 ring-indigo-400'
                              : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30'
                          }`}
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPreviewActionStatus('REJECTED');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all ${
                            previewActionStatus === 'REJECTED'
                              ? 'bg-slate-700 text-white ring-2 ring-slate-400'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}

                    {previewActionStatus && (
                      <p className="text-[10px] text-teal-300 pt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-teal-400" />
                        <span>Action recorded: {previewActionStatus}. Human reviewer remains in full control.</span>
                      </p>
                    )}
                  </div>

                  {/* Grounded Fact Verified Sub-row */}
                  <div className="flex items-center justify-between px-3 py-2 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">Verified Fact: {activeSample.verifiedFact}</span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider bg-emerald-500/20 px-1.5 py-0.2 rounded font-bold shrink-0">
                      Grounded
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* ENTERPRISE METRICS STRIP                                              */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <section className="bg-[#0b1c31] border-b border-slate-800 py-6 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300 font-mono">
                100%
              </p>
              <p className="text-xs text-slate-400 font-medium">Deterministic RegEx Precision</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300 font-mono">
                0
              </p>
              <p className="text-xs text-slate-400 font-medium">Hallucinated Citations</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300 font-mono">
                &lt; 250ms
              </p>
              <p className="text-xs text-slate-400 font-medium">Rule Engine Scanning Latency</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300 font-mono">
                SHA-256
              </p>
              <p className="text-xs text-slate-400 font-medium">Pre-Publication Certificates</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 3. HOW IT WORKS (3-Step Animated Scroll Section)                      */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-[#f8fafc] text-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-200/80 px-3 py-1 rounded-full">
              Deterministic Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
              How BrandLens AI Works
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Three simple steps from initial draft to verified, auditable publication.
            </p>
          </div>

          {/* 3-Step Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-7 shadow-xs hover:shadow-md transition-all space-y-4 scroll-reveal opacity-0 translate-y-8 duration-700 ease-out relative group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-3xl font-extrabold text-slate-200 font-mono">01</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Import Brand Knowledge
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Store tone guidelines, verified corporate facts, and banned or preferred terms once. Your knowledge base becomes the single source of truth for the entire company.
                </p>
              </div>

              {/* Step 1 Micro-UI Preview Card */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center justify-between text-slate-500">
                  <span>RULE #KB-201</span>
                  <span className="text-teal-700 font-bold">ACTIVE</span>
                </div>
                <p className="font-semibold text-slate-800">Preferred: "NovaTech Cloud"</p>
                <p className="text-rose-600 text-[10px]">Banned: ["Nova Cloud", "Nova-Tech"]</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl border border-teal-200/80 p-7 shadow-sm hover:shadow-md transition-all space-y-4 scroll-reveal opacity-0 translate-y-8 duration-700 ease-out delay-150 relative group ring-1 ring-teal-500/10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-3xl font-extrabold text-teal-100 font-mono">02</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>Run Hybrid Review</span>
                  <span className="text-[9px] font-mono uppercase bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-bold">
                    Core
                  </span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Deterministic regex engines catch banned terminology with 100% precision, while retrieval-grounded AI verifies factual claims without hallucinating citations.
                </p>
              </div>

              {/* Step 2 Micro-UI Preview Card */}
              <div className="p-3 bg-teal-50/50 border border-teal-200/80 rounded-xl space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center justify-between text-teal-800">
                  <span>HYBRID SCAN</span>
                  <span className="font-bold">&lt; 250ms</span>
                </div>
                <p className="text-slate-700 font-semibold">1 Terminology Flag • 1 Claim Grounded</p>
                <p className="text-teal-700 text-[10px]">WCAG AA Contrast Verified (7.2:1)</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-7 shadow-xs hover:shadow-md transition-all space-y-4 scroll-reveal opacity-0 translate-y-8 duration-700 ease-out delay-300 relative group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <Award className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-3xl font-extrabold text-slate-200 font-mono">03</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Human Sign-Off & Audit
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Creators revise with side-by-side diffs. Managers approve with cryptographic audit logging, issuing an immutable Pre-Publication Certificate before the draft goes live.
                </p>
              </div>

              {/* Step 3 Micro-UI Preview Card */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-200/80 rounded-xl space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center justify-between text-indigo-800">
                  <span>CERTIFICATE</span>
                  <span className="font-bold text-emerald-700">APPROVED</span>
                </div>
                <p className="text-slate-800 font-semibold truncate">Hash: e8b7...4f2a (SHA-256)</p>
                <p className="text-slate-500 text-[10px]">Actor: manager@novatech.demo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* INTERACTIVE BEFORE VS AFTER COMPARISON                                */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <section id="comparison" className="py-20 bg-slate-900 text-white relative overflow-hidden border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 scroll-reveal opacity-0 translate-y-8 duration-700">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-teal-400 bg-teal-950 border border-teal-500/30 px-3 py-1 rounded-full">
              Real-World Impact
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              The Cost of Ungoverned Publishing
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              See what happens when marketing campaigns ship with vs. without BrandLens AI guardrails.
            </p>

            {/* Toggle Switch */}
            <div className="pt-4 flex items-center justify-center">
              <div className="inline-flex p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setComparisonMode('raw')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    comparisonMode === 'raw'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Without BrandLens (Risk)
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonMode('governed')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    comparisonMode === 'governed'
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  With BrandLens (Governed)
                </button>
              </div>
            </div>
          </div>

          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Without Card */}
            <div
              className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${
                comparisonMode === 'raw'
                  ? 'bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/30'
                  : 'bg-slate-800/40 border-slate-700 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="font-bold text-sm text-rose-300 flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-400" />
                  Ungoverned Campaign Draft
                </span>
                <span className="text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">
                  High Risk
                </span>
              </div>
              <ul className="mt-5 space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Rogue Brand Terminology:</strong> Inconsistent usage ("Nova Cloud", "Nova-Tech") dilutes corporate identity.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Unsubstantiated Guarantees:</strong> "100% risk-free" promises expose company to regulatory and legal liability.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Inaccessible Colors:</strong> Low-contrast text on buttons fails WCAG 2.1 compliance standards.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Audit Trail:</strong> No verifiable record of who approved what or which version was signed off.</span>
                </li>
              </ul>
            </div>

            {/* With BrandLens Card */}
            <div
              className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${
                comparisonMode === 'governed'
                  ? 'bg-teal-950/20 border-teal-500/40 ring-1 ring-teal-500/30 shadow-xl'
                  : 'bg-slate-800/40 border-slate-700 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="font-bold text-sm text-teal-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  BrandLens AI Governed Publication
                </span>
                <span className="text-[10px] font-mono uppercase bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-bold">
                  Verified Safe
                </span>
              </div>
              <ul className="mt-5 space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>100% Deterministic Consistency:</strong> RegEx automatically replaces non-compliant terms with camelCase "NovaTech Cloud".</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Strict Fact Grounding:</strong> Claims link to active Master Services Agreement citations or flag as UNSUPPORTED.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>WCAG AA Compliance:</strong> Palette contrast analyzer verifies color luminance before visual assets ship.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Cryptographic Certificate:</strong> Immutable append-only ledger issues a SHA-256 signed audit certificate upon manager sign-off.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 4. CORE CAPABILITIES (Compact 4-Card Grid)                            */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 lg:py-28 bg-white border-t border-slate-200/80 text-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full">
              Engine Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
              Core Capabilities
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Built specifically for deterministic brand safety and legal compliance—not ungrounded text generation.
            </p>
          </div>

          {/* 4-Card Compact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Capability 1 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-teal-300 transition-all space-y-3 shadow-xs hover:shadow-md group">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold transition-transform group-hover:scale-110">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Zero-Hallucination Citations
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Every finding links directly to an approved guideline or fact. When a claim lacks evidence, BrandLens flags it as <span className="font-semibold text-rose-600">UNSUPPORTED</span> rather than inventing a citation.
                </p>
              </div>
              <span className="inline-block text-[10px] font-mono font-bold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded">
                100% Grounded
              </span>
            </div>

            {/* Capability 2 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-teal-300 transition-all space-y-3 shadow-xs hover:shadow-md group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center font-bold transition-transform group-hover:scale-110">
                <GitCompare className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Intent-Preserving Fixes
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Never blindly rewrites or destroys author intent. Provides granular Accept, Edit, and Reject suggestions with character-level visual diffing so editors remain in total control.
                </p>
              </div>
              <span className="inline-block text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
                Human-in-the-Loop
              </span>
            </div>

            {/* Capability 3 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-teal-300 transition-all space-y-3 shadow-xs hover:shadow-md group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center font-bold transition-transform group-hover:scale-110">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Multi-Tenant RBAC
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Strict server-side Role-Based Access Control isolates workspaces. Admin, Manager, Reviewer, and Creator roles ensure creators propose while only managers can approve.
                </p>
              </div>
              <span className="inline-block text-[10px] font-mono font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded">
                Strict Server RBAC
              </span>
            </div>

            {/* Capability 4 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-teal-300 transition-all space-y-3 shadow-xs hover:shadow-md group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold transition-transform group-hover:scale-110">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Audit Trail & Insights
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Every edit, override, and sign-off is preserved in an append-only ledger. Aggregated insights spot recurring terminology and tone mistakes across campaign teams.
                </p>
              </div>
              <span className="inline-block text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                Immutable Ledger
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 5. BOTTOM CONVERSION CTA BANNER                                       */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-[#0f2744] text-white relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0f2744] via-[#0d233c] to-[#071322] border border-teal-500/30 shadow-2xl text-center space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Enterprise-Grade Governance
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Ready to govern your brand before it ships?
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              Equip your marketing, product, and legal teams with pre-publication guardrails. No more rogue claims, tone mismatches, or embarrassing terminology slip-ups.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-teal-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-slate-600 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all"
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                disabled={demoRoleLoading}
                className="text-xs text-teal-300 hover:text-teal-200 underline underline-offset-4 decoration-teal-500/50 py-2 px-2 transition-colors"
              >
                {demoRoleLoading ? 'Loading Demo...' : '1-Click Judge Demo'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 6. FAQ SECTION (Interactive Accordion, 5 Concise Q&As)                */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 lg:py-28 bg-[#f8fafc] text-slate-900 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-200/80 px-3 py-1 rounded-full">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Clear answers on how BrandLens AI safeguards brand compliance without hallucination.
            </p>
          </div>

          {/* 5 Interactive Accordion Items */}
          <div className="space-y-3.5">
            {[
              {
                category: 'Engine Scope',
                q: 'What does BrandLens AI check?',
                a: 'BrandLens AI validates terminology (preferred vs. banned brand names with 100% deterministic precision), tone & voice (exaggerated or superlative marketing claims), factual claims (grounded against approved company facts), and visual accessibility (WCAG 2.1 color contrast and missing alt text).',
              },
              {
                category: 'Human-in-the-Loop',
                q: 'Does AI automatically rewrite or publish my content?',
                a: 'No. BrandLens AI follows a strict human-in-the-loop philosophy. The system flags issues and proposes contextual suggestions that humans can Accept, Edit, or Reject. A draft can never be published without explicit sign-off from an authorized Manager or Admin.',
              },
              {
                category: 'Grounding & Citations',
                q: 'What happens if a claim has no approved source?',
                a: 'BrandLens AI explicitly marks the statement as CLAIM_UNSUPPORTED with an empty citation list. It never manufactures, guesses, or hallucinates citations. Reviewers must either provide an approved source reference or remove the claim before the draft can be approved.',
              },
              {
                category: 'Multi-Tenant Collaboration',
                q: 'Can multiple team members collaborate in the same workspace?',
                a: 'Yes. Workspaces support multi-tenant team collaboration with strict server-side RBAC (Admin, Manager, Reviewer, and Creator roles). Admins can invite teammates by email, and invited members gain role-appropriate access instantly upon sign-in.',
              },
              {
                category: 'Evaluator Testing',
                q: 'How can judges test the platform quickly?',
                a: 'Judges can click the "1-Click Judge Demo" button on the hero or sign-in page to instantly access a pre-seeded NovaTech Global workspace with pre-populated brand guidelines, facts, terminology rules, and pending approval drafts.',
              },
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-teal-700 transition-colors focus:outline-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold hidden sm:inline-block">
                        {faq.category}
                      </span>
                      <span>{faq.q}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-teal-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 7. FOOTER                                                             */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <footer className="bg-[#071322] text-slate-400 pt-16 pb-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Main 4-column footer content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand & Tagline */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center text-white shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-white text-base tracking-tight">BrandLens AI</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Intelligent brand governance, before you publish. Deterministic guardrails for enterprise communications.
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Deterministic Guard Active</span>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Quick Links</p>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleScrollTo('how-it-works')}
                    className="hover:text-teal-300 transition-colors"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleScrollTo('features')}
                    className="hover:text-teal-300 transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleScrollTo('comparison')}
                    className="hover:text-teal-300 transition-colors"
                  >
                    Governance Comparison
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleScrollTo('faq')}
                    className="hover:text-teal-300 transition-colors"
                  >
                    FAQ
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('login')}
                    className="hover:text-teal-300 transition-colors"
                  >
                    Sign In
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('signup')}
                    className="hover:text-teal-300 transition-colors"
                  >
                    Get Started Free
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Key Features */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Platform</p>
              <ul className="space-y-2 text-slate-400">
                <li>Deterministic Terminology Guard</li>
                <li>Grounded Fact Verification</li>
                <li>Multi-Tenant Server RBAC</li>
                <li>Pre-Publication Certificates</li>
                <li>WCAG 2.1 Contrast Analyzer</li>
              </ul>
            </div>

            {/* Col 4: Contact & Team ALGO_X Info */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Team ALGO_X</p>
              <div className="space-y-1.5 text-slate-300">
                <p className="font-semibold text-white">Global Institute of Science and Technology</p>
                <div className="flex items-center gap-2 text-slate-400 pt-1">
                  <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <a href="tel:+916295501027" className="hover:text-teal-300 transition-colors">
                    +91 62955 01027
                  </a>
                </div>
                <div className="pt-2">
                  <span className="text-[10px] font-mono text-slate-500 block">
                    Built for Pre-Publication Governance Hackathon 2026
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© 2026 BrandLens AI — Team ALGO_X. All rights reserved.</p>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Deep Navy & Teal Design System</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-700" />
              <span>Multi-Tenant Cloud Edition</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
