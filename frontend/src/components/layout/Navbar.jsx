import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  User, 
  LogOut, 
  Building2, 
  ChevronDown, 
  Menu, 
  X, 
  Sparkles,
  Shield,
  Layers,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { AuthModal } from '../../features/auth/AuthModal';
import { CreateWorkspaceModal } from '../CreateWorkspaceModal';

export function Navbar({ onToggleMobileMenu, isMobileMenuOpen = false }) {
  const { user, activeOrg, activeRole, workspaces, logout, switchOrg } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const orgDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target)) {
        setShowOrgDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REVIEWER':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CREATOR':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
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
          {(activeOrg || user) && (
            <div ref={orgDropdownRef} className="relative">
              <button
                onClick={() => setShowOrgDropdown((prev) => !prev)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/90 active:bg-slate-200/70 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 transition-all shadow-xs hover:border-slate-300"
              >
                <div className="w-5 h-5 rounded-lg bg-white shadow-xs border border-slate-200/60 flex items-center justify-center shrink-0">
                  <Building2 className="w-3 h-3 text-brand-600" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold max-w-[80px] xs:max-w-[110px] sm:max-w-[140px] truncate text-slate-800 text-[11px] sm:text-xs leading-tight">
                    {activeOrg?.name || 'Workspace'}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${
                    activeRole === 'ADMIN' ? 'text-purple-600' :
                    activeRole === 'MANAGER' ? 'text-blue-600' :
                    activeRole === 'REVIEWER' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {activeRole}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${showOrgDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showOrgDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Your Workspaces ({workspaces?.length || 0})
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Multi-Tenant</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto py-1">
                    {workspaces?.map((w) => {
                      const orgId = String(w._id || w.id);
                      const isActive = String(activeOrg?._id || activeOrg?.id) === orgId;
                      return (
                        <button
                          key={orgId}
                          onClick={() => {
                            switchOrg(orgId);
                            setShowOrgDropdown(false);
                          }}
                          className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition-colors ${
                            isActive ? 'bg-brand-50/80 text-brand-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isActive ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{w.name || 'Unnamed Org'}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold shrink-0 ${getRoleBadgeColor(w.role)}`}>
                            {w.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-1.5 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowOrgDropdown(false);
                        setShowCreateModal(true);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-brand-600 hover:bg-brand-50/80 rounded-xl flex items-center gap-2 font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Create Workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User profile / Login */}
          {user ? (
            <div ref={userDropdownRef} className="relative">
              <button
                onClick={() => setShowUserDropdown((prev) => !prev)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 sm:pr-3 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition-all shadow-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[100px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono -mt-0.5">
                    {activeRole}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                    <div className="mt-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getRoleBadgeColor(activeRole)}`}>
                        {activeRole} Role
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In / Demo</span>
            </button>
          )}
        </div>
      </header>

      {/* Auth Modal (if triggered while logged out in header) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        canClose={true}
      />
    </>
  );
}
