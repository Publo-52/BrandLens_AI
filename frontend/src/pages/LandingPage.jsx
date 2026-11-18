import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  X,
  FileCheck2,
  Lock,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

const THEMES = {
  aurora: {
    id: 'aurora',
    name: '1. Pearl & Aurora Mist',
    bg: '#fafafc',
    orb1: 'rgba(167, 139, 250, 0.34)',
    orb2: 'rgba(56, 189, 248, 0.28)',
    orb3: 'rgba(244, 114, 182, 0.22)',
    gridColor: 'rgba(15, 23, 42, 0.06)',
    ringColor: 'rgba(99, 102, 241, 0.14)',
    surface: 'rgba(255, 255, 255, 0.72)',
    surfaceSolid: 'rgba(255, 255, 255, 0.92)',
    text: '#0f172a',
    muted: '#64748b',
    border: 'rgba(15, 23, 42, 0.08)',
    btnBg: '#0f172a',
    btnText: '#ffffff',
    btnGhost: 'rgba(15, 23, 42, 0.05)',
    accent: '#6366f1',
    accentSoft: 'rgba(99, 102, 241, 0.11)',
    shadow: '0 20px 50px -15px rgba(15, 23, 42, 0.08)',
    dotGrad: 'linear-gradient(135deg, #a78bfa, #38bdf8, #f472b6)'
  },
  midnight: {
    id: 'midnight',
    name: '2. Silk Midnight & Sapphire',
    bg: '#09090d',
    orb1: 'rgba(99, 102, 241, 0.34)',
    orb2: 'rgba(14, 165, 233, 0.24)',
    orb3: 'rgba(168, 85, 247, 0.2)',
    gridColor: 'rgba(255, 255, 255, 0.07)',
    ringColor: 'rgba(129, 140, 248, 0.16)',
    surface: 'rgba(24, 24, 32, 0.65)',
    surfaceSolid: 'rgba(255, 255, 255, 0.04)',
    text: '#f8fafc',
    muted: '#94a3b8',
    border: 'rgba(255, 255, 255, 0.1)',
    btnBg: '#ffffff',
    btnText: '#09090d',
    btnGhost: 'rgba(255, 255, 255, 0.08)',
    accent: '#818cf8',
    accentSoft: 'rgba(129, 140, 248, 0.16)',
    shadow: '0 20px 50px -15px rgba(0, 0, 0, 0.5)',
    dotGrad: 'linear-gradient(135deg, #09090d, #6366f1, #0ea5e9)'
  },
  glacier: {
    id: 'glacier',
    name: '3. Glacier Mint & Frosted Sky',
    bg: '#f6fbfa',
    orb1: 'rgba(45, 212, 191, 0.28)',
    orb2: 'rgba(56, 189, 248, 0.26)',
    orb3: 'rgba(167, 243, 208, 0.32)',
    gridColor: 'rgba(13, 148, 136, 0.08)',
    ringColor: 'rgba(13, 148, 136, 0.15)',
    surface: 'rgba(255, 255, 255, 0.72)',
    surfaceSolid: 'rgba(255, 255, 255, 0.92)',
    text: '#0f2724',
    muted: '#475569',
    border: 'rgba(15, 39, 36, 0.08)',
    btnBg: '#0d9488',
    btnText: '#ffffff',
    btnGhost: 'rgba(13, 148, 136, 0.07)',
    accent: '#0d9488',
    accentSoft: 'rgba(13, 148, 136, 0.12)',
    shadow: '0 20px 50px -15px rgba(13, 148, 136, 0.08)',
    dotGrad: 'linear-gradient(135deg, #99f6e4, #bae6fd, #e0e7ff)'
  },
  dusk: {
    id: 'dusk',
    name: '4. Obsidian Rose & Dusk',
    bg: '#0c090e',
    orb1: 'rgba(244, 63, 94, 0.26)',
    orb2: 'rgba(245, 158, 11, 0.2)',
    orb3: 'rgba(168, 85, 247, 0.22)',
    gridColor: 'rgba(255, 255, 255, 0.06)',
    ringColor: 'rgba(251, 113, 133, 0.16)',
    surface: 'rgba(28, 21, 32, 0.66)',
    surfaceSolid: 'rgba(255, 255, 255, 0.04)',
    text: '#faf5ff',
    muted: '#a1a1aa',
    border: 'rgba(255, 255, 255, 0.1)',
    btnBg: '#fb7185',
    btnText: '#0c090e',
    btnGhost: 'rgba(255, 255, 255, 0.08)',
    accent: '#fb7185',
    accentSoft: 'rgba(251, 113, 133, 0.16)',
    shadow: '0 20px 50px -15px rgba(0, 0, 0, 0.6)',
    dotGrad: 'linear-gradient(135deg, #120d14, #fb7185, #f59e0b)'
  }
};

const FAQ_ITEMS = [
  {
    question: 'What does BrandLens AI check?',
    answer: 'Tone, banned and preferred terminology, factual claims against approved knowledge sources, and pre-publication compliance rules with zero hallucinations.'
  },
  {
    question: 'Does AI rewrite or publish automatically?',
    answer: 'Never. BrandLens AI only suggests fixes with exact citations; human creators and managers review and sign off on every draft.'
  },
  {
    question: 'Can multiple team members work in the same workspace?',
    answer: 'Yes. Multi-tenant RBAC allows Admins to invite team members with dedicated Creator, Reviewer, Manager, or Admin roles.'
  },
  {
    question: 'What happens if a claim has no approved source?',
    answer: 'The claim is immediately flagged as UNSUPPORTED. BrandLens AI never guesses or synthesizes unverified corporate claims.'
  },
  {
    question: 'How can hackathon judges test the platform quickly?',
    answer: 'Click the "1-Click Judge Demo" button to explore an instantly provisioned NovaTech Global workspace with pre-seeded guidelines and review queues.'
  }
];

export function LandingPage({ onNavigate, onDemoLogin }) {
  const { user, loginWithDemoRole } = useAuth();
  const [activeThemeKey, setActiveThemeKey] = useState('aurora');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [demoRoleLoading, setDemoRoleLoading] = useState(false);

  // Showcase interactive action states
  const [previewActionStatus, setPreviewActionStatus] = useState(null);
  const [showcaseSample, setShowcaseSample] = useState(0);

  const activeTheme = THEMES[activeThemeKey] || THEMES.aurora;

  const handleDemoClick = async (role = 'ADMIN') => {
    try {
      setDemoRoleLoading(true);
      if (onDemoLogin) {
        await onDemoLogin(role);
      } else if (loginWithDemoRole) {
        await loginWithDemoRole(role);
        if (onNavigate) onNavigate('app', { tab: 'dashboard' });
      }
    } catch (err) {
      console.error('Judge Demo Error:', err);
    } finally {
      setDemoRoleLoading(false);
    }
  };

  const cssVariables = {
    '--bg': activeTheme.bg,
    '--orb-1': activeTheme.orb1,
    '--orb-2': activeTheme.orb2,
    '--orb-3': activeTheme.orb3,
    '--grid-color': activeTheme.gridColor,
    '--ring-color': activeTheme.ringColor,
    '--surface': activeTheme.surface,
    '--surface-solid': activeTheme.surfaceSolid,
    '--text': activeTheme.text,
    '--muted': activeTheme.muted,
    '--border': activeTheme.border,
    '--btn-bg': activeTheme.btnBg,
    '--btn-text': activeTheme.btnText,
    '--btn-ghost': activeTheme.btnGhost,
    '--accent': activeTheme.accent,
    '--accent-soft': activeTheme.accentSoft,
    '--shadow': activeTheme.shadow,
  };

  return (
    <div
      style={cssVariables}
      className="min-h-screen text-[var(--text)] transition-colors duration-500 selection:bg-[var(--accent)] selection:text-white relative font-sans overflow-x-hidden bg-[var(--bg)]"
    >
      <style>{`
        @keyframes drift1 {
          0% { transform: translate(-65%, 0px) scale(1); }
          100% { transform: translate(-45%, 50px) scale(1.08); }
        }
        @keyframes drift2 {
          0% { transform: translate(0px, 0px) scale(1); }
          100% { transform: translate(-60px, 70px) scale(1.1); }
        }
        @keyframes drift3 {
          0% { transform: translate(0px, 0px) scale(1); }
          100% { transform: translate(70px, -50px) scale(1.06); }
        }
        .anim-orb-1 {
          animation: drift1 16s ease-in-out infinite alternate;
        }
        .anim-orb-2 {
          animation: drift2 20s ease-in-out infinite alternate;
        }
        .anim-orb-3 {
          animation: drift3 18s ease-in-out infinite alternate;
        }
        .dot-grid-canvas {
          background-image: radial-gradient(var(--grid-color) 1.25px, transparent 1.25px);
          background-size: 28px 28px;
          -webkit-mask-image: radial-gradient(ellipse 75% 65% at 50% 25%, #000 30%, transparent 100%);
          mask-image: radial-gradient(ellipse 75% 65% at 50% 25%, #000 30%, transparent 100%);
        }
      `}</style>

      {/* ── Abstract Background Canvas ────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle Masked Dot Grid */}
        <div className="absolute inset-0 dot-grid-canvas" />

        {/* Drifting Abstract Gradient Orbs */}
        <div
          style={{ background: 'var(--orb-1)' }}
          className="absolute w-[560px] h-[560px] -top-40 left-1/2 -translate-x-[65%] rounded-full blur-[85px] will-change-transform transition-colors duration-700 anim-orb-1"
        />
        <div
          style={{ background: 'var(--orb-2)' }}
          className="absolute w-[480px] h-[480px] top-10 -right-24 rounded-full blur-[85px] will-change-transform transition-colors duration-700 anim-orb-2"
        />
        <div
          style={{ background: 'var(--orb-3)' }}
          className="absolute w-[440px] h-[440px] -bottom-32 -left-20 rounded-full blur-[85px] will-change-transform transition-colors duration-700 anim-orb-3"
        />

        {/* Minimal Abstract SVG Rings & Flowing Curve */}
        <svg
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] opacity-75 pointer-events-none"
          viewBox="0 0 1200 700"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="600"
            cy="240"
            r="240"
            stroke="var(--ring-color)"
            strokeWidth="1"
            strokeDasharray="6 8"
          />
          <circle
            cx="600"
            cy="240"
            r="360"
            stroke="var(--ring-color)"
            strokeWidth="1"
          />
          <path
            d="M-40 420 C 260 280, 480 540, 780 360 C 980 240, 1120 380, 1260 300"
            stroke="var(--ring-color)"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* ── 1. Minimal Palette Switcher Bar (Sticky) ────────────────────────── */}
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md text-slate-100 py-2.5 px-4 sm:px-6 flex flex-wrap items-center justify-center gap-2 text-xs border-b border-white/10 shadow-sm">
        <span className="text-slate-300 font-medium tracking-wide">Abstract + Minimalist Themes:</span>
        {Object.values(THEMES).map((t) => {
          const isActive = activeThemeKey === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveThemeKey(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/15'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                style={{ background: t.dotGrad }}
              />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      <div className="relative z-10">
        {/* ── 2. Floating Glass Navbar ────────────────────────────────────────── */}
        <div className="max-w-[980px] mx-auto px-4 sm:px-6 mt-5">
          <nav
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
            className="backdrop-blur-xl border rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5 font-bold text-base tracking-tight">
              <span
                style={{ background: 'var(--accent)' }}
                className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
              />
              <span className="text-[var(--text)]">BrandLens AI</span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--muted)]">
              <a href="#how" className="hover:text-[var(--text)] transition-colors">
                How it works
              </a>
              <a href="#faq" className="hover:text-[var(--text)] transition-colors">
                FAQ
              </a>
            </div>

            {/* Action Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <button
                  onClick={() => onNavigate && onNavigate('app', { tab: 'dashboard' })}
                  style={{
                    background: 'var(--btn-bg)',
                    color: 'var(--btn-text)',
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open Workspace</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate && onNavigate('login')}
                    style={{ color: 'var(--text)' }}
                    className="px-4 py-2 rounded-full text-xs font-bold hover:bg-[var(--btn-ghost)] transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => onNavigate && onNavigate('signup')}
                    style={{
                      background: 'var(--btn-bg)',
                      color: 'var(--btn-text)',
                    }}
                    className="px-4 py-2 rounded-full text-xs font-bold shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </nav>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
              className="sm:hidden mt-2 p-4 rounded-2xl border backdrop-blur-xl shadow-lg space-y-3"
            >
              <a
                href="#how"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-[var(--muted)] py-1"
              >
                How it works
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-[var(--muted)] py-1"
              >
                FAQ
              </a>
              <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2">
                {user ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onNavigate) onNavigate('app', { tab: 'dashboard' });
                    }}
                    style={{
                      background: 'var(--btn-bg)',
                      color: 'var(--btn-text)',
                    }}
                    className="w-full py-2.5 rounded-full text-xs font-bold"
                  >
                    Open Workspace
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onNavigate) onNavigate('login');
                      }}
                      className="w-full py-2 rounded-full text-xs font-bold border border-[var(--border)] text-[var(--text)]"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onNavigate) onNavigate('signup');
                      }}
                      style={{
                        background: 'var(--btn-bg)',
                        color: 'var(--btn-text)',
                      }}
                      className="w-full py-2.5 rounded-full text-xs font-bold text-white shadow-md"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Centered Minimalist Hero ────────────────────────────────────── */}
        <section className="max-w-[820px] mx-auto px-6 pt-16 sm:pt-20 pb-12 sm:pb-16 text-center">
          {/* Eyebrow Pill */}
          <div
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--muted)',
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold mb-6 backdrop-blur-md shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Pre-Publication Brand Governance</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.08] mb-5 text-[var(--text)]">
            Publish with confidence, every single time.
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg text-[var(--muted)] max-w-[560px] mx-auto mb-8 font-normal leading-relaxed">
            BrandLens AI checks your drafts against approved guidelines, facts, and tone—returning calm, cited fixes while keeping humans in control.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate && onNavigate('signup')}
              style={{
                background: 'var(--btn-bg)',
                color: 'var(--btn-text)',
              }}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span>Get Started</span>
            </button>
            <button
              onClick={() => onNavigate && onNavigate('login')}
              style={{ color: 'var(--text)' }}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold hover:bg-[var(--btn-ghost)] transition-colors cursor-pointer"
            >
              <span>Sign In</span>
            </button>
            <button
              onClick={() => handleDemoClick('ADMIN')}
              disabled={demoRoleLoading}
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--accent)',
              }}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-bold border backdrop-blur-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{demoRoleLoading ? 'Loading Judge Demo...' : '1-Click Judge Demo'}</span>
            </button>
          </div>
        </section>

        {/* ── 4. Satisfying Minimal Preview Window (Showcase) ────────────────── */}
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 mb-12">
          <div
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow)',
            }}
            className="backdrop-blur-2xl border rounded-3xl p-5 sm:p-7 transition-all"
          >
            {/* Window Top Bar */}
            <div
              style={{ borderColor: 'var(--border)' }}
              className="flex flex-wrap items-center justify-between pb-4 mb-5 border-b text-xs text-[var(--muted)] gap-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                </div>
                <span className="font-medium text-[var(--text)]">
                  BrandLens Review Studio • 2 checks verified
                </span>
              </div>
              <button
                onClick={() => {
                  setShowcaseSample((prev) => (prev === 0 ? 1 : 0));
                  setPreviewActionStatus(null);
                }}
                className="text-[11px] font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Switch Sample Draft</span>
              </button>
            </div>

            {/* Check Row 1 (Terminology Rule) */}
            <div
              style={{
                background: 'var(--surface-solid)',
                borderColor: 'var(--border)',
              }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 sm:p-4.5 rounded-2xl border mb-3 transition-transform hover:scale-[1.008]"
            >
              <div>
                <div className="text-sm font-semibold text-[var(--text)] mb-0.5">
                  {showcaseSample === 0
                    ? 'Terminology Check — "100% risk-free"'
                    : 'Colloquialism Check — "Nova Cloud"'}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {showcaseSample === 0
                    ? 'Matches Legal Rule #4.2 • Intent-preserving replacement ready ("guaranteed 99.9% uptime SLA")'
                    : 'Matches Voice Rule #2.1 • Brand name must be formatted as "NovaTech Cloud"'}
                </div>
              </div>

              {previewActionStatus ? (
                <span
                  style={{
                    background:
                      previewActionStatus === 'ACCEPTED'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : previewActionStatus === 'EDITED'
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    color:
                      previewActionStatus === 'ACCEPTED'
                        ? '#059669'
                        : previewActionStatus === 'EDITED'
                        ? '#2563eb'
                        : '#dc2626',
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0 flex items-center gap-1 self-start sm:self-center"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{previewActionStatus}</span>
                </span>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                  <button
                    onClick={() => setPreviewActionStatus('ACCEPTED')}
                    style={{
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-85 transition-opacity cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => setPreviewActionStatus('EDITED')}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setPreviewActionStatus('REJECTED')}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--muted)] hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>

            {/* Check Row 2 (Claim Verification - UNSUPPORTED) */}
            <div
              style={{
                background: 'var(--surface-solid)',
                borderColor: 'var(--border)',
              }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 sm:p-4.5 rounded-2xl border transition-transform hover:scale-[1.008]"
            >
              <div>
                <div className="text-sm font-semibold text-[var(--text)] mb-0.5">
                  Claim Verification — Uncited metric detected
                </div>
                <div className="text-xs text-[var(--muted)]">
                  No approved fact found in workspace • Never guessed or hallucinated by AI
                </div>
              </div>
              <span
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0 tracking-wider self-start sm:self-center"
              >
                UNSUPPORTED
              </span>
            </div>
          </div>
        </div>

        {/* ── 5. Airy 3-Step Flow ────────────────────────────────────────────── */}
        <section id="how" className="max-w-[940px] mx-auto px-6 pt-16 sm:pt-20">
          <div className="text-center mb-11">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mb-2">
              Calm, structured workflow
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted)]">
              Everything your team needs between drafting and hitting publish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <div
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
              className="backdrop-blur-xl border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              <div
                style={{ color: 'var(--accent)' }}
                className="text-xs font-bold tracking-wider mb-3"
              >
                01 • KNOWLEDGE
              </div>
              <h3 className="text-base font-bold text-[var(--text)] mb-1.5">
                Import Brand Rules
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                Keep guidelines, approved facts, and banned terms in one versioned workspace.
              </p>
            </div>

            {/* Step 2 */}
            <div
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
              className="backdrop-blur-xl border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              <div
                style={{ color: 'var(--accent)' }}
                className="text-xs font-bold tracking-wider mb-3"
              >
                02 • VERIFY
              </div>
              <h3 className="text-base font-bold text-[var(--text)] mb-1.5">
                Hybrid AI + Rules
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                Deterministic checks run first; AI cites exact sources or flags unsupported claims.
              </p>
            </div>

            {/* Step 3 */}
            <div
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
              className="backdrop-blur-xl border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              <div
                style={{ color: 'var(--accent)' }}
                className="text-xs font-bold tracking-wider mb-3"
              >
                03 • APPROVE
              </div>
              <h3 className="text-base font-bold text-[var(--text)] mb-1.5">
                Sign Off & Export
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                Revise with diffs, get manager sign-off, and export a Pre-Publication Certificate.
              </p>
            </div>
          </div>
        </section>

        {/* ── 6. Bottom CTA Banner ───────────────────────────────────────────── */}
        <div id="cta" className="max-w-[780px] mx-auto px-6 mt-20">
          <div
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow)',
            }}
            className="backdrop-blur-2xl border rounded-3xl p-8 sm:p-12 text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mb-2.5">
              Ready to try BrandLens AI?
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted)] mb-6 max-w-md mx-auto">
              Create your workspace or explore instantly with 1-click judge demo roles.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onNavigate && onNavigate('signup')}
                style={{
                  background: 'var(--btn-bg)',
                  color: 'var(--btn-text)',
                }}
                className="px-6 py-3 rounded-full text-sm font-semibold shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                Get Started
              </button>
              <button
                onClick={() => onNavigate && onNavigate('login')}
                style={{ color: 'var(--text)' }}
                className="px-6 py-3 rounded-full text-sm font-semibold hover:bg-[var(--btn-ghost)] transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => handleDemoClick('ADMIN')}
                disabled={demoRoleLoading}
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--accent)',
                }}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-bold border backdrop-blur-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{demoRoleLoading ? 'Loading Demo...' : '1-Click Judge Demo'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 7. Minimal FAQ Accordion ───────────────────────────────────────── */}
        <section id="faq" className="max-w-[680px] mx-auto px-6 pt-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
              Questions &amp; Answers
            </h2>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-1">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full text-left py-4 px-1 flex items-center justify-between gap-4 text-sm sm:text-base font-semibold text-[var(--text)] hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <span
                      style={{ color: 'var(--accent)' }}
                      className="text-base font-bold shrink-0 transition-transform duration-200"
                    >
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pb-4 px-1 text-xs sm:text-sm text-[var(--muted)] leading-relaxed animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 8. Clean Footer ────────────────────────────────────────────────── */}
        <footer
          style={{ borderColor: 'var(--border)' }}
          className="max-w-[940px] mx-auto mt-20 px-6 py-8 pb-12 border-t flex flex-wrap items-center justify-between gap-5 text-xs text-[var(--muted)]"
        >
          <div>
            <strong className="text-[var(--text)]">BrandLens AI</strong> • Team ALGO_X • Global Institute of Science and Technology • +91 62955 01027
          </div>
          <div className="flex items-center gap-5 flex-wrap">
            <a href="#how" className="hover:text-[var(--text)] transition-colors">
              How it works
            </a>
            <a href="#faq" className="hover:text-[var(--text)] transition-colors">
              FAQ
            </a>
            <button
              onClick={() => onNavigate && onNavigate('login')}
              className="hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate && onNavigate('signup')}
              className="hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;
