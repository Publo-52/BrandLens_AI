import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';

export function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState(null);
  const [isWakingServer, setIsWakingServer] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organisationName: '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Seed/Login helper
  const handleDemoLogin = async (roleName, demoEmail, demoPass) => {
    setLoading(true);
    setActiveDemoRole(roleName);
    setError(null);
    setIsWakingServer(false);

    // Render free-tier cold starts take 30-50s if the service is asleep
    const wakeTimer = setTimeout(() => {
      setIsWakingServer(true);
    }, 2500);

    try {
      try {
        await login(demoEmail, demoPass);
        clearTimeout(wakeTimer);
        onClose();
      } catch {
        // If demo user does not exist in the database yet, register them on the fly!
        await register({
          name: `NovaTech ${roleName}`,
          email: demoEmail,
          password: demoPass,
          organisationName: 'NovaTech Global',
        });
        clearTimeout(wakeTimer);
        onClose();
      }
    } catch (err) {
      clearTimeout(wakeTimer);
      setError(err.message);
    } finally {
      clearTimeout(wakeTimer);
      setLoading(false);
      setActiveDemoRole(null);
      setIsWakingServer(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/30 flex items-center justify-center border border-brand-400/30">
              <ShieldCheck className="w-5 h-5 text-brand-300" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
              BrandLens Access
            </span>
          </div>
          <h3 className="text-xl font-bold text-white">
            {isRegister ? 'Create Organisation Account' : 'Sign in to Workspace'}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {isRegister
              ? 'Set up your organisation and start governing brand content.'
              : 'Access your team brand guidelines, reviews, and approval queue.'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Sukhen Das"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Workspace / Brand Name</label>
                  <input
                    type="text"
                    name="organisationName"
                    required
                    value={formData.organisationName}
                    onChange={handleChange}
                    placeholder="e.g. NovaTech Global"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
            >
              {loading ? 'Processing...' : isRegister ? 'Create Account & Workspace' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Logins */}
          {!isRegister && (
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Role Demo Logins</span>
              </div>

              {isWakingServer && (
                <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-center gap-2 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                  <span>Waking up free cloud server on Render (~30s on cold start)...</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin('Admin', 'admin@novatech.com', 'DemoPass123!')}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded text-slate-700 hover:text-brand-700 text-left font-medium transition-colors disabled:opacity-50 relative flex flex-col justify-center"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">NovaTech Admin</span>
                    {activeDemoRole === 'Admin' && <Loader2 className="w-3 h-3 animate-spin text-brand-600" />}
                  </div>
                  <div className="text-[10px] text-slate-400">ADMIN Role</div>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin('Manager', 'manager@novatech.com', 'DemoPass123!')}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded text-slate-700 hover:text-brand-700 text-left font-medium transition-colors disabled:opacity-50 relative flex flex-col justify-center"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">NovaTech Manager</span>
                    {activeDemoRole === 'Manager' && <Loader2 className="w-3 h-3 animate-spin text-brand-600" />}
                  </div>
                  <div className="text-[10px] text-slate-400">MANAGER Role</div>
                </button>
              </div>
            </div>
          )}

          {/* Switch tab */}
          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(null); }}
                  className="text-brand-600 hover:underline font-semibold"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(null); }}
                  className="text-brand-600 hover:underline font-semibold"
                >
                  Create one now
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
