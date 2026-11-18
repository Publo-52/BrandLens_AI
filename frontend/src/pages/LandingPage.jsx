import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
  RotateCcw,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

// Fixed Theme: Option 1 — Studio Pearl & Indigo
const OPTION_1_THEME_VARS = {
  '--bg': '#f9fafb',
  '--orb-1': 'rgba(99, 102, 241, 0.18)',
  '--orb-2': 'rgba(20, 184, 166, 0.16)',
  '--cursor-glow': 'rgba(99, 102, 241, 0.14)',
  '--grid-color': 'rgba(15, 23, 42, 0.08)',
  '--surface': 'rgba(255, 255, 255, 0.85)',
  '--surface-elevated': '#ffffff',
  '--text': '#09090b',
  '--muted': '#52525b',
  '--border': 'rgba(9, 9, 11, 0.09)',
  '--accent': '#4f46e5',
  '--accent-2': '#0d9488',
  '--accent-soft': 'rgba(79, 70, 229, 0.09)',
  '--btn-bg': '#09090b',
  '--btn-text': '#ffffff',
  '--shadow': '0 24px 60px -15px rgba(9, 9, 11, 0.1)'
};

const SAMPLE_DATA = {
  social: {
    title: 'Terminology Violation: "100% risk-free"',
    cite: 'Legal Rule #4.2',
    rawHtml: (
      <>
        Upgrade to NovaTech Cloud today for a{' '}
        <span className="hl-bad">100% risk-free</span> migration with{' '}
        <span className="hl-warn">3x faster</span> deployment across teams.
      </>
    ),
    fixedHtml: (
      <>
        Upgrade to NovaTech Cloud today for a{' '}
        <span className="hl-fixed">guided, scheduled</span> migration with{' '}
        <span className="hl-warn">3x faster</span> deployment across teams.
      </>
    ),
    desc: (
      <>
        Banned promotional guarantee. Suggested intent-preserving fix:{' '}
        <strong>"guided, scheduled"</strong>. Unverified claim <em>"3x faster"</em>{' '}
        is marked <strong>UNSUPPORTED</strong>.
      </>
    )
  },
  email: {
    title: 'Product Naming: "Nova Cloud"',
    cite: 'Lexicon Rule #1.1',
    rawHtml: (
      <>
        Our <span className="hl-bad">Nova Cloud</span> platform guarantees{' '}
        <span className="hl-warn">zero downtime</span> for every enterprise rollout.
      </>
    ),
    fixedHtml: (
      <>
        Our <span className="hl-fixed">NovaTech Cloud</span> platform guarantees{' '}
        <span className="hl-warn">zero downtime</span> for every enterprise rollout.
      </>
    ),
    desc: (
      <>
        Use official product name <strong>"NovaTech Cloud"</strong>. Claim{' '}
        <em>"zero downtime"</em> has no approved fact source in workspace knowledge.
      </>
    )
  }
};

export function LandingPage({ onNavigate, onDemoLogin }) {
  const { user, loginWithDemoRole } = useAuth();
  const [currentSample, setCurrentSample] = useState('social');
  const [isFixed, setIsFixed] = useState(false);
  const [demoRoleLoading, setDemoRoleLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mockupRef = useRef(null);
  const containerRef = useRef(null);

  // Dynamic Smooth Cursor Tracking + 3D Tilt on Product Mockup
  useEffect(() => {
    let tx = window.innerWidth * 0.5;
    let ty = window.innerHeight * 0.3;
    let cx = tx;
    let cy = ty;
    let animId = null;

    const onPointerMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const loop = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;

      if (containerRef.current) {
        containerRef.current.style.setProperty('--mx', `${cx.toFixed(1)}px`);
        containerRef.current.style.setProperty('--my', `${cy.toFixed(1)}px`);
      }

      if (mockupRef.current) {
        const r = mockupRef.current.getBoundingClientRect();
        const rx = ((cy - (r.top + r.height / 2)) / r.height) * -4;
        const ry = ((cx - (r.left + r.width / 2)) / r.width) * 4;
        const clampedRx = Math.max(-3.5, Math.min(3.5, rx)).toFixed(2);
        const clampedRy = Math.max(-3.5, Math.min(3.5, ry)).toFixed(2);
        mockupRef.current.style.setProperty('--rx', `${clampedRx}deg`);
        mockupRef.current.style.setProperty('--ry', `${clampedRy}deg`);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

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

  const sample = SAMPLE_DATA[currentSample];

  return (
    <div
      ref={containerRef}
      style={{
        ...OPTION_1_THEME_VARS,
        '--mx': '50vw',
        '--my': '30vh'
      }}
      className="min-h-screen text-[var(--text)] relative font-sans overflow-x-hidden bg-[var(--bg)] selection:bg-[var(--accent)] selection:text-white"
    >
      <style>{`
        /* Ambient Cursor-Reactive Background */
        .bg-layer {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px);
          background-size: 48px 48px;
          -webkit-mask-image: radial-gradient(340px circle at var(--mx) var(--my), rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.12) 60%, transparent 100%);
          mask-image: radial-gradient(340px circle at var(--mx) var(--my), rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.12) 60%, transparent 100%);
        }
        .cursor-aura {
          position: absolute;
          inset: 0;
          background: radial-gradient(560px circle at var(--mx) var(--my), var(--cursor-glow), transparent 70%);
        }
        .ambient-orb-1 {
          position: absolute;
          width: 620px; height: 620px; border-radius: 50%;
          top: -220px; right: -120px;
          background: var(--orb-1);
          filter: blur(100px);
        }
        .ambient-orb-2 {
          position: absolute;
          width: 520px; height: 520px; border-radius: 50%;
          bottom: -180px; left: -120px;
          background: var(--orb-2);
          filter: blur(100px);
        }

        .grad-text {
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* 3D Mockup Container */
        .mockup-shell {
          background: var(--surface);
          backdrop-filter: blur(22px);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: var(--shadow);
          overflow: hidden;
          transform: perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
          transition: transform 0.15s ease-out;
        }

        .hl-bad {
          background: rgba(244, 63, 94, 0.14);
          border-bottom: 2px solid #f43f5e;
          padding: 1px 4px;
          border-radius: 4px;
          font-weight: 600;
        }
        .hl-warn {
          background: rgba(245, 158, 11, 0.15);
          border-bottom: 2px solid #f59e0b;
          padding: 1px 4px;
          border-radius: 4px;
          font-weight: 600;
        }
        .hl-fixed {
          background: rgba(16, 185, 129, 0.14);
          border-bottom: 2px solid #10b981;
          padding: 1px 4px;
          border-radius: 4px;
          font-weight: 600;
        }
      `}</style>

      {/* ── Ambient Background Canvas ────────────────────────────────────────── */}
      <div className="bg-layer">
        <div className="ambient-orb-1" />
        <div className="ambient-orb-2" />
        <div className="bg-grid" />
        <div className="cursor-aura" />
      </div>

      {/* ── Floating Sticky Navigation Bar ──────────────────────────────────── */}
      <nav className="max-w-[1160px] mx-auto px-6 py-4 flex items-center justify-between relative z-20">
        <div
          onClick={() => onNavigate && onNavigate('landing')}
          className="flex items-center gap-2.5 font-bold text-base tracking-tight cursor-pointer"
        >
          <div
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))'
            }}
            className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-extrabold text-xs shadow-sm"
          >
            B
          </div>
          <span>BrandLens AI</span>
        </div>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--muted)]">
          <a
            href="#workflow"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            Workflow
          </a>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            FAQ
          </a>
        </div>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          {user ? (
            <button
              onClick={() => onNavigate && onNavigate('app', { tab: 'dashboard' })}
              style={{
                background: 'var(--btn-bg)',
                color: 'var(--btn-text)'
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Workspace</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => onNavigate && onNavigate('login')}
                style={{
                  color: 'var(--text)',
                  borderColor: 'var(--border)'
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold border hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate && onNavigate('signup')}
                style={{
                  background: 'var(--btn-bg)',
                  color: 'var(--btn-text)'
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)'
          }}
          className="sm:hidden mx-4 p-4 rounded-2xl border backdrop-blur-xl shadow-xl space-y-3 relative z-30 mb-4"
        >
          <a
            href="#workflow"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="block text-sm font-medium text-[var(--muted)] py-1.5 cursor-pointer"
          >
            Workflow
          </a>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="block text-sm font-medium text-[var(--muted)] py-1.5 cursor-pointer"
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
                  color: 'var(--btn-text)'
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold"
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
                  className="w-full py-2 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text)]"
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
                    color: 'var(--btn-text)'
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold shadow-md"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Asymmetric Editorial Hero ────────────────────────────────────────── */}
      <section className="max-w-[1160px] mx-auto px-6 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        {/* Left Column: Value Proposition */}
        <div className="lg:col-span-6 space-y-5">
          <div
            style={{
              color: 'var(--accent)',
              background: 'var(--accent-soft)'
            }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pre-Publication Brand Governance</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight leading-[1.12]">
            Brand control that cites rules,{' '}
            <span className="grad-text">before you publish.</span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--muted)] max-w-[480px] leading-relaxed">
            Check drafts against your approved guidelines, facts, and terminology in
            seconds. Every suggestion preserves your intent and keeps humans in
            charge.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => onNavigate && onNavigate('signup')}
              style={{
                background: 'var(--btn-bg)',
                color: 'var(--btn-text)'
              }}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Get Started
            </button>
            <button
              onClick={() => onNavigate && onNavigate('login')}
              style={{
                color: 'var(--text)',
                borderColor: 'var(--border)'
              }}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => handleDemoClick('ADMIN')}
              disabled={demoRoleLoading}
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--accent)'
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border backdrop-blur-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{demoRoleLoading ? 'Loading Judge Demo...' : '1-Click Judge Demo'}</span>
            </button>
          </div>

          {/* Proof Strip */}
          <div
            style={{ borderColor: 'var(--border)' }}
            className="grid grid-cols-3 gap-3 pt-5 border-t"
          >
            <div>
              <strong className="block text-xs sm:text-sm font-bold text-[var(--text)]">
                Zero Hallucinations
              </strong>
              <span className="text-[11px] text-[var(--muted)]">
                Strict source-ID validation
              </span>
            </div>
            <div>
              <strong className="block text-xs sm:text-sm font-bold text-[var(--text)]">
                Human Sign-Off
              </strong>
              <span className="text-[11px] text-[var(--muted)]">
                Accept, edit, or reject
              </span>
            </div>
            <div>
              <strong className="block text-xs sm:text-sm font-bold text-[var(--text)]">
                Audit Ledger
              </strong>
              <span className="text-[11px] text-[var(--muted)]">
                Pre-Publication Certificate
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Realistic Interactive Product Mockup with 3D Tilt */}
        <div className="lg:col-span-6">
          <div ref={mockupRef} className="mockup-shell">
            {/* Topbar */}
            <div
              style={{ borderColor: 'var(--border)' }}
              className="p-3.5 px-4 border-b flex items-center justify-between text-xs text-[var(--muted)]"
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f87171] border border-[#ef4444]/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] border border-[#f59e0b]/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] border border-[#10b981]/40" />
                </div>
                <span className="font-semibold text-[var(--text)] text-xs ml-1">
                  Review Studio • Interactive Demo
                </span>
              </div>

              {/* Sample Tabs */}
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSample('social');
                    setIsFixed(false);
                  }}
                  style={{
                    background:
                      currentSample === 'social' ? 'var(--accent-soft)' : 'transparent',
                    color: currentSample === 'social' ? 'var(--accent)' : 'var(--muted)',
                    borderColor:
                      currentSample === 'social' ? 'var(--accent)' : 'var(--border)'
                  }}
                  className="px-2.5 py-1 rounded-md border text-[11px] font-semibold cursor-pointer transition-colors"
                >
                  Social Post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSample('email');
                    setIsFixed(false);
                  }}
                  style={{
                    background:
                      currentSample === 'email' ? 'var(--accent-soft)' : 'transparent',
                    color: currentSample === 'email' ? 'var(--accent)' : 'var(--muted)',
                    borderColor:
                      currentSample === 'email' ? 'var(--accent)' : 'var(--border)'
                  }}
                  className="px-2.5 py-1 rounded-md border text-[11px] font-semibold cursor-pointer transition-colors"
                >
                  Launch Email
                </button>
              </div>
            </div>

            {/* Mockup Body */}
            <div className="p-4 sm:p-5 space-y-3.5">
              {/* Draft Editor View */}
              <div
                style={{
                  background: 'var(--surface-elevated)',
                  borderColor: 'var(--border)'
                }}
                className="border rounded-xl p-4 text-xs sm:text-sm leading-relaxed"
              >
                {isFixed ? sample.fixedHtml : sample.rawHtml}
              </div>

              {/* Finding Panel */}
              <div
                style={{
                  background: 'var(--surface-elevated)',
                  borderColor: 'var(--border)'
                }}
                className="border rounded-xl p-3.5 sm:p-4 text-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <strong className="text-xs font-bold text-[var(--text)]">
                    {sample.title}
                  </strong>
                  <span
                    style={{
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)'
                    }}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  >
                    {sample.cite}
                  </span>
                </div>

                <p className="text-[11px] sm:text-xs text-[var(--muted)] leading-relaxed">
                  {sample.desc}
                </p>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsFixed(true)}
                    disabled={isFixed}
                    style={{
                      background: isFixed ? 'rgba(16, 185, 129, 0.15)' : 'var(--btn-bg)',
                      color: isFixed ? '#059669' : 'var(--btn-text)'
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-default"
                  >
                    {isFixed ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied to v2 Draft</span>
                      </>
                    ) : (
                      <span>Accept Suggested Fix</span>
                    )}
                  </button>

                  {isFixed && (
                    <button
                      type="button"
                      onClick={() => setIsFixed(false)}
                      className="text-[11px] text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Draft</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Connected Workflow Rail (#workflow) ─────────────────────────────── */}
      <section id="workflow" className="max-w-[1100px] mx-auto px-6 pt-16 relative z-10">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)] mb-1.5">
            How it fits your publishing flow
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Three focused stages from raw draft to approved release.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
            className="backdrop-blur-md border rounded-2xl p-6 hover:-translate-y-1 transition-all"
          >
            <div
              style={{ color: 'var(--accent)' }}
              className="text-xs font-bold tracking-wider uppercase mb-2"
            >
              01 • Knowledge Base
            </div>
            <h3 className="text-base font-bold text-[var(--text)] mb-2">
              Store Approved Truth
            </h3>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Keep tone rules, approved corporate facts, and banned/preferred terms
              versioned in one workspace.
            </p>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
            className="backdrop-blur-md border rounded-2xl p-6 hover:-translate-y-1 transition-all"
          >
            <div
              style={{ color: 'var(--accent)' }}
              className="text-xs font-bold tracking-wider uppercase mb-2"
            >
              02 • Hybrid Review
            </div>
            <h3 className="text-base font-bold text-[var(--text)] mb-2">
              Deterministic + Grounded AI
            </h3>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Exact rule checks run first; AI checks tone and claims using only retrieved
              company sources.
            </p>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
            className="backdrop-blur-md border rounded-2xl p-6 hover:-translate-y-1 transition-all"
          >
            <div
              style={{ color: 'var(--accent)' }}
              className="text-xs font-bold tracking-wider uppercase mb-2"
            >
              03 • Human Approval
            </div>
            <h3 className="text-base font-bold text-[var(--text)] mb-2">
              Diffs, Sign-Off &amp; Certificate
            </h3>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Creators revise with diffs, reviewers override with reasons, and managers
              lock the approved release.
            </p>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA Box (#cta) ───────────────────────────────────────────── */}
      <div id="cta" className="max-w-[1044px] mx-auto px-6 mt-16 relative z-10">
        <div
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow)'
          }}
          className="backdrop-blur-2xl border rounded-3xl p-8 sm:p-10 flex flex-wrap justify-between items-center gap-6"
        >
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)] mb-1">
              Ready to govern your brand?
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              Create your team workspace or test all roles with 1-click judge demo access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate && onNavigate('signup')}
              style={{
                background: 'var(--btn-bg)',
                color: 'var(--btn-text)'
              }}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Get Started
            </button>
            <button
              onClick={() => onNavigate && onNavigate('login')}
              style={{
                color: 'var(--text)',
                borderColor: 'var(--border)'
              }}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => handleDemoClick('ADMIN')}
              disabled={demoRoleLoading}
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--accent)'
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{demoRoleLoading ? 'Loading...' : '1-Click Judge Demo'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Frequently Asked Questions (#faq) ────────────────────────────────── */}
      <section id="faq" className="max-w-[1100px] mx-auto px-6 pt-16 relative z-10">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
            className="border rounded-2xl p-5"
          >
            <h4 className="text-sm sm:text-base font-bold text-[var(--text)] mb-2">
              What does BrandLens AI check?
            </h4>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Tone, banned/preferred terminology, factual claims against approved
              sources, and accessibility rules with deterministic guarantees.
            </p>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
            className="border rounded-2xl p-5"
          >
            <h4 className="text-sm sm:text-base font-bold text-[var(--text)] mb-2">
              Does AI rewrite or publish automatically?
            </h4>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              No. AI only suggests intent-preserving fixes with exact citations;
              authorised humans accept edits and approve publication.
            </p>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
            className="border rounded-2xl p-5"
          >
            <h4 className="text-sm sm:text-base font-bold text-[var(--text)] mb-2">
              What if a claim has no approved source?
            </h4>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              BrandLens AI flags it distinctly as <strong>UNSUPPORTED</strong> instead
              of guessing or fabricating whether it is true or false.
            </p>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)'
            }}
            className="border rounded-2xl p-5"
          >
            <h4 className="text-sm sm:text-base font-bold text-[var(--text)] mb-2">
              Can multiple teammates share one workspace?
            </h4>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Yes. Multi-tenant RBAC allows Admins to invite teammates by email with
              Creator, Reviewer, Manager, or Admin permissions.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer
        style={{ borderColor: 'var(--border)' }}
        className="max-w-[1100px] mx-auto mt-16 px-6 py-8 pb-14 border-t flex flex-wrap items-center justify-between gap-5 text-xs text-[var(--muted)] relative z-10"
      >
        <div>
          <strong className="text-[var(--text)]">BrandLens AI</strong> • Team ALGO_X
          • Global Institute of Science and Technology • +91 62955 01027
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          <a
            href="#workflow"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            Workflow
          </a>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-[var(--text)] transition-colors cursor-pointer"
          >
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
  );
}

export default LandingPage;
