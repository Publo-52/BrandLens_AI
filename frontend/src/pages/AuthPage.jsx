import React, { useState } from 'react';
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
  Shield,
  Briefcase,
  Search,
  PenTool,
  Loader2,
  Building2,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

export function AuthPage({ onAuthSuccess }) {
  const {
    loginWithFirebase,
    signUpWithFirebase,
    loginWithGoogle,
    loginWithDemoRole,
    login,
    register,
  } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please provide your full name.');
        if (!email.trim()) throw new Error('Please enter a valid email.');
        if (!password || password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }

        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          organisationName: workspaceName.trim() || `${name.trim().split(' ')[0]}'s Workspace`,
        });
        setSuccessMsg('Account created successfully! Entering workspace...');
      } else {
        if (!email.trim() || !password) {
          throw new Error('Please enter both email and password.');
        }
        await login(email.trim(), password);
        setSuccessMsg('Signed in successfully! Loading workspace...');
      }
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      let msg = err.message || 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Please create an account.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 8 characters.';
      }
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
      console.error('Google sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError(null);
    setDemoLoadingRole(role);
    try {
      if (loginWithDemoRole) {
        await loginWithDemoRole(role);
      } else {
        // Fallback demo credentials
        const emailMap = {
          ADMIN: 'admin@novatech.demo',
          MANAGER: 'manager@novatech.demo',
          REVIEWER: 'reviewer@novatech.demo',
          CREATOR: 'creator@novatech.demo',
        };
        await login(emailMap[role] || 'admin@novatech.demo', 'NovaTechDemo2026!');
      }
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setError(err.message || `Failed to sign in as ${role}.`);
    } finally {
      setDemoLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#081726]">
      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Left Column: Visual Brand / Value Proposition (#0f2744 Navy Palette)  */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <div className="lg:w-1/2 bg-[#0f2744] text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-500 via-teal-400 to-cyan-300 text-[#0f2744] flex items-center justify-center font-black shadow-lg shadow-teal-500/30">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">BrandLens AI</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                  Multi-Tenant RBAC
                </span>
              </div>
              <p className="text-xs text-slate-300">Intelligent brand governance, before you publish.</p>
            </div>
          </div>
        </div>

        {/* Core Value Highlights */}
        <div className="my-10 lg:my-0 relative z-10 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/70 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Multi-Tenant Architecture & Server-Side RBAC</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Govern brand compliance with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
                absolute tenant isolation
              </span>
            </h2>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed max-w-lg">
              Automated multi-modal guardrails for marketing, design, and legal teams. Switch workspaces seamlessly and enforce strict server-side permissions across every API route.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {[
              {
                title: 'Strict Server-Side RBAC',
                desc: 'Creator, Reviewer, Manager, and Admin roles verified at database and API boundary.',
              },
              {
                title: 'Multi-Tenant Workspace Isolation',
                desc: 'Automatic invite acceptance, custom branding rules, and zero cross-tenant data leakage.',
              },
              {
                title: 'Multi-Modal Governance Engine',
                desc: 'Visual WCAG contrast checks, claim verification, and banned terminology detection.',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10 backdrop-blur-xs">
                <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{item.title}</p>
                  <p className="text-[11px] text-slate-300 leading-normal mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Footer Meta */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Firebase Auth + MongoDB Atlas Multi-Tenant Cloud</span>
          </div>
          <span>Team ALGO_X</span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Right Column: Authentication Card & 1-Click Judge Demo Role Buttons    */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-slate-900/90 relative">
        <div className="w-full max-w-md space-y-6">
          {/* Main Card */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            {/* Tabs: Sign In / Create Account */}
            <div className="flex border-b border-slate-700 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  resetForm();
                }}
                className={`flex-1 pb-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors ${
                  mode === 'signin'
                    ? 'border-teal-400 text-teal-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  resetForm();
                }}
                className={`flex-1 pb-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors ${
                  mode === 'signup'
                    ? 'border-teal-400 text-teal-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error / Success Alerts */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-snug">{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-5 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-teal-400" />
                <span className="leading-snug">{successMsg}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              {/* Google G SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-slate-800 px-3 text-slate-400 font-medium">or continue with email</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Workspace Name <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="Acme Global"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-[#0f2744] font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-teal-500/20 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0f2744]" />
                ) : (
                  <>
                    <span>{mode === 'signup' ? 'Create Account & Workspace' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* Dedicated Hackathon Judges Section: 1-Click Demo Role Login       */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="bg-slate-800/60 border border-teal-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  1-Click Judge Demo Role Login
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">NovaTech Global</span>
            </div>
            <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
              Instantly test server-side RBAC enforcement. Switch roles with 1 click:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  role: 'ADMIN',
                  label: 'Admin',
                  desc: 'Full workspace & invite control',
                  icon: Shield,
                  border: 'hover:border-purple-500/60 hover:bg-purple-500/10',
                  badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                },
                {
                  role: 'MANAGER',
                  label: 'Manager',
                  desc: 'Rule & content approvals',
                  icon: Briefcase,
                  border: 'hover:border-blue-500/60 hover:bg-blue-500/10',
                  badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                },
                {
                  role: 'REVIEWER',
                  label: 'Reviewer',
                  desc: 'Review queue sign-off',
                  icon: Search,
                  border: 'hover:border-amber-500/60 hover:bg-amber-500/10',
                  badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                },
                {
                  role: 'CREATOR',
                  label: 'Creator',
                  desc: 'Drafts only (403 on rules/approve)',
                  icon: PenTool,
                  border: 'hover:border-emerald-500/60 hover:bg-emerald-500/10',
                  badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                },
              ].map((item) => {
                const IconComponent = item.icon;
                const isSelected = demoLoadingRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleDemoLogin(item.role)}
                    disabled={demoLoadingRole !== null}
                    className={`p-3 rounded-xl bg-slate-900/60 border border-slate-700 text-left transition-all flex flex-col justify-between ${item.border} active:scale-[0.98] disabled:opacity-50`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1.5">
                        <IconComponent className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-xs font-bold text-white">{item.label}</span>
                      </div>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${item.badge}`}>
                        {item.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{item.desc}</p>
                    {isSelected && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-teal-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Authenticating...</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-400 mt-3 text-center">
              💡 Selecting <strong>Creator</strong> restricts Approve and Brand Knowledge actions with strict HTTP 403 Forbidden checks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
