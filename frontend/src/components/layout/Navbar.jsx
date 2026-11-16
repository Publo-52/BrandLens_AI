import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Building2, 
  LogOut, 
  LogIn, 
  ChevronDown, 
  Check, 
  Sparkles,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { AuthModal } from '../../features/auth/AuthModal';

export function Navbar({ onToggleMobileMenu, isMobileMenuOpen }) {
  const { user, memberships, activeOrg, activeRole, logout, switchOrg } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-400/20';
      case 'MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-400/20';
      case 'REVIEWER':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-400/20';
      case 'CREATOR':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-400/20';
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
        {/* Left side: Hamburger button (mobile/tablet only) + Brand identity */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 active:bg-slate-200/80 rounded-xl transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-800" />
            ) : (
              <Menu className="w-5 h-5 text-slate-800" />
            )}
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-md shadow-brand-500/25 ring-1 ring-white/20 transition-transform hover:scale-105 shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 bg-clip-text truncate">
                BrandLens AI
              </h1>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wide uppercase bg-gradient-to-r from-brand-50 to-indigo-50 text-brand-700 px-1.5 sm:px-2 py-0.5 rounded-full border border-brand-200/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] shrink-0">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5 font-medium truncate">
              <span>Intelligent Brand Governance</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Active Engine
              </span>
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Workspace selector */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowOrgDropdown((prev) => !prev)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/90 active:bg-slate-200/70 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 transition-all shadow-xs hover:border-slate-300"
              >
                <div className="w-5 h-5 rounded-lg bg-white shadow-xs border border-slate-200/60 flex items-center justify-center shrink-0">
                  <Building2 className="w-3 h-3 text-brand-600" />
                </div>
                <span className="font-semibold max-w-[80px] xs:max-w-[110px] sm:max-w-[140px] truncate text-slate-800 text-[11px] sm:text-xs">
                  {activeOrg?.name || 'Workspace'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${showOrgDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showOrgDropdown && (
                <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between px-2.5 py-1.5 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Workspaces
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{memberships.length} active</span>
                  </div>
                  <div className="space-y-1">
                    {memberships.map((m) => {
                      const org = m.organisationId;
                      if (!org) return null;
                      const isSelected = org._id === activeOrg?._id;
                      return (
                        <button
                          key={org._id}
                          onClick={() => {
                            switchOrg(org._id);
                            setShowOrgDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-brand-50 to-indigo-50/50 text-brand-800 font-semibold border border-brand-200/60 shadow-xs'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <div className="text-left truncate">
                            <div className="truncate font-medium">{org.name}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{m.role.toLowerCase()}</div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User profile & auth controls */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-3 pl-1.5 sm:pl-3 border-l border-slate-200">
              <div className="flex items-center gap-2 text-left">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-700 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-sm ring-2 ring-slate-100 shrink-0">
                  {user.name?.slice(0, 2).toUpperCase() || 'US'}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {user.name}
                  </div>
                  <span
                    className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getRoleBadgeColor(
                      activeRole
                    )}`}
                  >
                    {activeRole}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-xl transition-colors border border-transparent hover:border-rose-100 shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
