import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Shield,
  Briefcase,
  Search,
  PenTool,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

/* ─── Pearl & Aurora Mist Design Tokens ─────────────────────────────────── */
const T = {
  bg: '#fafafc',
  orb1: 'rgba(167, 139, 250, 0.28)',
  orb2: 'rgba(56, 189, 248, 0.22)',
  orb3: 'rgba(244, 114, 182, 0.18)',
  surface: 'rgba(255, 255, 255, 0.78)',
  border: 'rgba(15, 23, 42, 0.08)',
  text: '#0f172a',
  muted: '#64748b',
  accent: '#6366f1',
  accentSoft: 'rgba(99, 102, 241, 0.1)',
  btnBg: '#0f172a',
  btnText: '#ffffff',
  inputBg: 'rgba(255, 255, 255, 0.9)',
  inputBorder: 'rgba(15, 23, 42, 0.12)',
  inputFocus: '#6366f1',
  ringColor: 'rgba(99, 102, 241, 0.14)',
};

export function AuthPage({ onAuthSuccess, initialMode = 'signin', onBackToHome }) {
  const {
    loginWithGoogle,
    loginWithDemoRole,
    login,
    register,
  } = useAuth();

  const [mode, setMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryMode = urlParams.get('mode');
      if (queryMode === 'signup' || queryMode === 'register') return 'signup';
      if (queryMode === 'signin' || queryMode === 'login') return 'signin';
    }
    return initialMode || 'signin';
  });

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const resetForm = () => { setError(null); setSuccessMsg(null); };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please provide your full name.');
        if (!email.trim()) throw new Error('Please enter a valid email.');
        if (!password || password.length < 8)
          throw new Error('Password must be at least 8 characters long.');
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          organisationName: workspaceName.trim() || `${name.trim().split(' ')[0]}'s Workspace`,
        });
        setSuccessMsg('Account created! Entering workspace...');
      } else {
        if (!email.trim() || !password) throw new Error('Please enter both email and password.');
        await login(email.trim(), password);
        setSuccessMsg('Signed in! Loading workspace...');
      }
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered. Sign in instead.';
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
      else if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
      else if (err.code === 'auth/weak-password') msg = 'Password must be at least 8 characters.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user')
        setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError(null);
    setDemoLoadingRole(role);
    try {
      if (loginWithDemoRole) await loginWithDemoRole(role);
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setError(err.message || `Failed to sign in as ${role}.`);
    } finally {
      setDemoLoadingRole(null);
    }
  };

  /* ─── Input className helper ─────────────────────────────────────────── */
  const inputCls = `w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-900 placeholder-slate-400
    border border-[rgba(15,23,42,0.12)] bg-white/90
    focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
    transition-all`;

  return (
    <div
      className="min-h-screen font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: T.bg }}
    >
      <style>{`
        @keyframes orbDrift1 { 0% { transform: translate(-60%, 0) scale(1); } 100% { transform: translate(-45%, 50px) scale(1.08); } }
        @keyframes orbDrift2 { 0% { transform: scale(1); } 100% { transform: translate(-55px, 65px) scale(1.1); } }
        @keyframes orbDrift3 { 0% { transform: scale(1); } 100% { transform: translate(65px, -45px) scale(1.06); } }
        .orb1 { animation: orbDrift1 16s ease-in-out infinite alternate; }
        .orb2 { animation: orbDrift2 20s ease-in-out infinite alternate; }
        .orb3 { animation: orbDrift3 18s ease-in-out infinite alternate; }
        .dot-grid {
          background-image: radial-gradient(rgba(15,23,42,0.06) 1.25px, transparent 1.25px);
          background-size: 28px 28px;
          -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 100%);
          mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 100%);
        }
      `}</style>

      {/* Background canvas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 dot-grid" />
        <div style={{ background: T.orb1 }} className="absolute w-[500px] h-[500px] -top-40 left-1/2 rounded-full blur-[80px] will-change-transform orb1" />
        <div style={{ background: T.orb2 }} className="absolute w-[420px] h-[420px] top-16 -right-20 rounded-full blur-[80px] will-change-transform orb2" />
        <div style={{ background: T.orb3 }} className="absolute w-[380px] h-[380px] -bottom-24 -left-16 rounded-full blur-[80px] will-change-transform orb3" />
        <svg className="absolute -top-8 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] opacity-60 pointer-events-none" viewBox="0 0 1100 600" fill="none">
          <circle cx="550" cy="220" r="210" stroke={T.ringColor} strokeWidth="1" strokeDasharray="6 8" />
          <circle cx="550" cy="220" r="330" stroke={T.ringColor} strokeWidth="1" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-[420px] space-y-5">

        {/* Back link */}
        {onBackToHome && (
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-1 cursor-pointer"
          >
            ← Back to Home
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-1">
          <img src="/favicon-32x32.png" alt="BrandLens AI Logo" className="w-6 h-6 rounded-md shadow-xs" />
          <span className="font-extrabold text-base tracking-tight text-slate-900">BrandLens AI</span>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">v1.0</span>
        </div>

        {/* Headline */}
        <div className="mb-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {mode === 'signin' ? 'Welcome back.' : 'Create your workspace.'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'signin'
              ? 'Sign in to continue governing your brand.'
              : 'Start publishing with confidence in under a minute.'}
          </p>
        </div>

        {/* Main Glass Card */}
        <div
          style={{ background: T.surface, borderColor: T.border }}
          className="rounded-2xl border backdrop-blur-xl p-6 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08)]"
        >
          {/* Mode Tabs */}
          <div
            style={{ borderColor: T.border }}
            className="flex border-b mb-5"
          >
            {['signin', 'signup'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); resetForm(); }}
                className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition-colors cursor-pointer ${
                  mode === m
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm font-semibold hover:bg-slate-50 hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className={inputCls + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Workspace Name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Acme Global"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-full bg-slate-900 text-white text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Account & Workspace' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Judge Demo Card */}
        <div
          style={{ background: T.surface, borderColor: T.border }}
          className="rounded-2xl border backdrop-blur-xl p-5 shadow-[0_8px_30px_rgba(99,102,241,0.06)]"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <h3 className="text-xs font-bold tracking-widest uppercase text-indigo-600">1-Click Judge Demo</h3>
            <span className="ml-auto text-[10px] text-slate-400 font-mono">NovaTech Global</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
            Instantly explore server-side RBAC. Each role unlocks different views and API permissions.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { role: 'ADMIN',    label: 'Admin',    desc: 'Full workspace control', icon: Shield,   color: 'indigo' },
              { role: 'MANAGER',  label: 'Manager',  desc: 'Rule & content approvals', icon: Briefcase, color: 'blue' },
              { role: 'REVIEWER', label: 'Reviewer', desc: 'Review queue sign-off', icon: Search,    color: 'amber' },
              { role: 'CREATOR',  label: 'Creator',  desc: 'Drafts only', icon: PenTool,  color: 'emerald' },
            ].map((item) => {
              const Icon = item.icon;
              const isLoading = demoLoadingRole === item.role;
              const colorMap = {
                indigo:  { ring: 'hover:border-indigo-300  hover:bg-indigo-50',  badge: 'bg-indigo-100  text-indigo-600' },
                blue:    { ring: 'hover:border-blue-300    hover:bg-blue-50',    badge: 'bg-blue-100    text-blue-600' },
                amber:   { ring: 'hover:border-amber-300   hover:bg-amber-50',   badge: 'bg-amber-100   text-amber-600' },
                emerald: { ring: 'hover:border-emerald-300 hover:bg-emerald-50', badge: 'bg-emerald-100 text-emerald-600' },
              };
              const c = colorMap[item.color];
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleDemoLogin(item.role)}
                  disabled={demoLoadingRole !== null}
                  className={`p-3 rounded-xl bg-white border border-slate-200 text-left transition-all ${c.ring} active:scale-[0.98] disabled:opacity-50 cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-bold text-slate-800">{item.label}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.badge}`}>
                      {item.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                  {isLoading && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-indigo-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-400 mt-3 text-center leading-relaxed">
            <strong>Creator</strong> role is restricted — see HTTP 403 enforcement live.
          </p>
        </div>

        {/* Footer line */}
        <p className="text-center text-[10px] text-slate-400 pb-2">
          BrandLens AI • Team ALGO_X • GIST • +91 62955 01027
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
