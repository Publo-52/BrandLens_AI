import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  Mail, 
  Lock, 
  User, 
  Building2,
  Shield,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from './AuthContext';

export function AuthModal({ isOpen, onClose }) {
  const { login, register, loginWithGoogle, loginWithDemoRole } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState(null);
  const [isWakingServer, setIsWakingServer] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organisationName: '',
  });

  // Esc key listener to close modal without page refresh
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isRegister && formData.password && formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          organisationName: formData.organisationName,
        });
      } else {
        await login(formData.email, formData.password);
      }
      onClose();
    } catch (err) {
      let msg = err.message || 'Authentication failed';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Please create an account.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password must be at least 8 characters.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In with Firebase popup
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setGoogleLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed. Please try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in Firebase. Add your localhost / deployment domain under Firebase Console -> Authentication -> Settings -> Authorized domains.');
      } else if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
        setError('Google Provider is not enabled in Firebase. Please enable Google in Firebase Console -> Authentication -> Sign-in method.');
      } else {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
      setGoogleLoading(false);
    }
  };

  // Quick Demo Role Login helper
  const handleDemoLogin = async (roleName) => {
    setLoading(true);
    setActiveDemoRole(roleName);
    setError(null);
    try {
      if (loginWithDemoRole) {
        await loginWithDemoRole(roleName.toUpperCase());
      } else {
        await login(`${roleName.toLowerCase()}@novatech.demo`, 'NovaTechDemo2026!');
      }
      onClose();
    } catch (err) {
      setError(err.message || `Failed to sign in as ${roleName}`);
    } finally {
      setLoading(false);
      setActiveDemoRole(null);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-md max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 text-white relative border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            title="Close modal (Esc)"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center border border-brand-400/30 text-brand-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-300">
              BrandLens AI Access
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-white tracking-tight">
            {isRegister ? 'Create Brand Workspace' : 'Sign In to Workspace'}
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {isRegister
              ? 'Launch your multi-tenant governance workspace in seconds.'
              : 'Access your team guidelines, compliance reviews, and approval queue.'}
          </p>

          {/* Segmented Tab Switcher */}
          <div className="flex bg-white/10 p-1 rounded-xl mt-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                !isRegister 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                isRegister 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              New Workspace
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="leading-relaxed">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="font-semibold text-rose-600 hover:underline shrink-0">
                Dismiss
              </button>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span>Connecting with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2.5 text-[10px] uppercase font-bold text-slate-400 shrink-0 tracking-wider">
              or continue with email
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Sukhen Das"
                      className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Workspace / Brand Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      name="organisationName"
                      required
                      value={formData.organisationName}
                      onChange={handleChange}
                      placeholder="e.g. NovaTech Global"
                      className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@novatech.com"
                  className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                {isRegister && (
                  <span className="text-[10px] text-slate-400 font-medium">Min. 8 characters</span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isRegister ? (
                <>
                  <span>Create Workspace & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Role Logins */}
          {!isRegister && (
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  1-Click Role Logins
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Pre-Configured</span>
              </div>

              {isWakingServer && (
                <div className="mb-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-2 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                  <span>Waking up free cloud backend on Render (~30s on cold start)...</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin('ADMIN')}
                  className="p-2.5 bg-gradient-to-br from-purple-50 to-slate-50 hover:from-purple-100 hover:to-purple-50 border border-purple-200 rounded-xl text-left transition-all disabled:opacity-50 relative flex flex-col justify-between group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 text-[11px]">Admin</span>
                    {activeDemoRole === 'ADMIN' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    ) : (
                      <Shield className="w-3.5 h-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                  <div className="text-[9px] text-purple-700 font-mono mt-0.5">ADMIN &bull; Full Policy Access</div>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin('MANAGER')}
                  className="p-2.5 bg-gradient-to-br from-indigo-50 to-slate-50 hover:from-indigo-100 hover:to-indigo-50 border border-indigo-200 rounded-xl text-left transition-all disabled:opacity-50 relative flex flex-col justify-between group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 text-[11px]">Manager</span>
                    {activeDemoRole === 'MANAGER' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                  <div className="text-[9px] text-indigo-700 font-mono mt-0.5">MANAGER &bull; Release Approver</div>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin('REVIEWER')}
                  className="p-2.5 bg-gradient-to-br from-amber-50 to-slate-50 hover:from-amber-100 hover:to-amber-50 border border-amber-200 rounded-xl text-left transition-all disabled:opacity-50 relative flex flex-col justify-between group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-[11px]">Reviewer</span>
                    {activeDemoRole === 'REVIEWER' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                  <div className="text-[9px] text-amber-700 font-mono mt-0.5">REVIEWER &bull; Finding Overrides</div>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin('CREATOR')}
                  className="p-2.5 bg-gradient-to-br from-emerald-50 to-slate-50 hover:from-emerald-100 hover:to-emerald-50 border border-emerald-200 rounded-xl text-left transition-all disabled:opacity-50 relative flex flex-col justify-between group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 text-[11px]">Creator</span>
                    {activeDemoRole === 'CREATOR' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                  <div className="text-[9px] text-emerald-700 font-mono mt-0.5">CREATOR &bull; Cannot Self-Approve</div>
                </button>
              </div>
            </div>
          )}

          {/* Security guarantee footer */}
          <div className="pt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Strict Multi-Tenant Isolation &bull; JWT Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
