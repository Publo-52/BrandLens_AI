import React, { useState } from 'react';
import { ShieldCheck, Building2, LogOut, LogIn, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { AuthModal } from '../../features/auth/AuthModal';

export function Navbar() {
  const { user, memberships, activeOrg, activeRole, logout, switchOrg } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'REVIEWER':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CREATOR':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 flex items-center justify-between z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold shadow-sm shadow-brand-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-slate-900 text-base tracking-tight">BrandLens AI</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded border border-brand-200">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Intelligent brand governance, before you publish.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Workspace Selector Dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowOrgDropdown((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold max-w-[140px] truncate">
                  {activeOrg?.name || 'My Workspace'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showOrgDropdown && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-30">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Your Workspaces
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
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                            isSelected
                              ? 'bg-brand-50 text-brand-700 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-left truncate">
                            <div className="truncate">{org.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{m.role}</div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile & Role or Sign In Button */}
          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                  {user.name?.slice(0, 2).toUpperCase() || 'US'}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[110px]">
                    {user.name}
                  </div>
                  <span
                    className={`inline-block text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
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
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
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
