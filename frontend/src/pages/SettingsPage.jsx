import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle, 
  CheckCircle2, 
  Save, 
  RefreshCw,
  Copy,
  Check,
  Mail,
  User,
  Shield,
  Layers,
  FileCheck2,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { api } from '../services/api';

const ALL_ROLES = ['ADMIN', 'MANAGER', 'REVIEWER', 'CREATOR'];

export function SettingsPage() {
  const { user, token, activeOrg, activeRole, refreshSession } = useAuth();
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [copiedSlug, setCopiedSlug] = useState(false);

  // Invite member state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('CREATOR');
  const [inviting, setInviting] = useState(false);

  // Org settings edit state
  const [orgName, setOrgName] = useState(activeOrg?.name || '');
  const [updatingOrg, setUpdatingOrg] = useState(false);

  useEffect(() => {
    if (activeOrg?.name) {
      setOrgName(activeOrg.name);
    }
  }, [activeOrg]);

  const loadMembers = useCallback(async () => {
    if (!activeOrg?._id || !token) return;
    setLoadingMembers(true);
    try {
      const data = await api.getMembers(activeOrg._id, token);
      setMembers(data.members || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMembers(false);
    }
  }, [activeOrg, token]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !activeOrg?._id || !token) return;
    setInviting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.inviteMember(
        activeOrg._id,
        { email: inviteEmail, name: inviteName, fullName: inviteName, role: inviteRole },
        token
      );
      setSuccessMsg(`Successfully added ${inviteEmail} as ${inviteRole}!`);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('CREATOR');
      await loadMembers();
    } catch (err) {
      setError(err.message || 'Invitation failed');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (!activeOrg?._id || !token) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.updateMemberRole(activeOrg._id, memberId, newRole, token);
      setSuccessMsg('Member role updated successfully!');
      await Promise.all([loadMembers(), refreshSession()]);
    } catch (err) {
      setError(err.message || 'Failed to update role');
      if (err.status === 403) {
        await refreshSession();
      }
    }
  };

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    if (!orgName.trim() || !activeOrg?._id || !token) return;
    setUpdatingOrg(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.updateOrganisation(activeOrg._id, { name: orgName }, token);
      setSuccessMsg('Workspace name updated successfully!');
      await refreshSession();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingOrg(false);
    }
  };

  const handleCopySlug = () => {
    if (!activeOrg?.slug) return;
    navigator.clipboard.writeText(activeOrg.slug);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const isAdmin = activeRole === 'ADMIN';
  const isManager = activeRole === 'MANAGER';
  const canManageMembers = isAdmin || isManager;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" />
            ADMIN
          </span>
        );
      case 'MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3 h-3 text-indigo-600" />
            MANAGER
          </span>
        );
      case 'REVIEWER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <FileCheck2 className="w-3 h-3 text-amber-600" />
            REVIEWER
          </span>
        );
      case 'CREATOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <User className="w-3 h-3 text-emerald-600" />
            CREATOR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Settings & Access Control</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Multi-tenant brand isolation parameters and server-side Role-Based Access Control (RBAC) governance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-800 border border-purple-200/80 rounded-xl shadow-xs">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold">Your Role: {activeRole}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-semibold text-rose-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="font-semibold text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Workspace General Info */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" />
            Workspace Organization Profile
          </h3>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
            Tenant Isolation Enabled
          </span>
        </div>

        <form onSubmit={handleUpdateOrg} className="max-w-xl space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Workspace Brand Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={orgName}
                disabled={!isAdmin}
                onChange={(e) => setOrgName(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 transition-all font-medium text-slate-900"
              />
              {isAdmin && (
                <button
                  type="submit"
                  disabled={updatingOrg}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{updatingOrg ? 'Saving...' : 'Save Name'}</span>
                </button>
              )}
            </div>
            {!isAdmin && (
              <p className="text-[11px] text-slate-400 mt-1">
                Only workspace Admins can modify the organization name.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Workspace Slug (Tenant Identifier)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={activeOrg?.slug || 'unknown'}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-mono cursor-not-allowed select-all"
              />
              <button
                type="button"
                onClick={handleCopySlug}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
              >
                {copiedSlug ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedSlug ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Cryptographically isolates all guidelines, approved facts, terminology libraries, and audit records.
            </p>
          </div>
        </form>
      </div>

      {/* Members & RBAC Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              Collaborators & Role-Based Access Control
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage team members, assign review responsibilities, and control publishing authority.
            </p>
          </div>
          <button
            onClick={loadMembers}
            className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMembers ? 'animate-spin text-brand-600' : ''}`} />
            <span>Refresh Roster</span>
          </button>
        </div>

        {/* Invite Member Form (ADMIN only) */}
        <form onSubmit={handleInvite} className="p-5 bg-gradient-to-br from-slate-50 to-brand-50/20 border border-slate-200/80 rounded-2xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <UserPlus className="w-4 h-4 text-brand-600" />
              <span>Invite New Collaborator</span>
            </div>
            {!isAdmin && (
              <span className="text-[11px] text-slate-400 font-medium">
                Admin privilege required to invite collaborators
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Full Name"
                value={inviteName}
                disabled={!isAdmin}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white disabled:bg-slate-100/80 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
            </div>

            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="colleague@company.com"
                value={inviteEmail}
                disabled={!isAdmin}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white disabled:bg-slate-100/80 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
            </div>

            <select
              value={inviteRole}
              disabled={!isAdmin}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium text-slate-800 disabled:bg-slate-100/80 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r} disabled={r === 'ADMIN' && !isAdmin}>
                  {r} {r === 'ADMIN' && !isAdmin ? '(Admin only)' : ''}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={!isAdmin || inviting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{inviting ? 'Inviting...' : 'Add to Workspace'}</span>
            </button>
          </div>
          {!isAdmin && (
            <p className="text-[11px] text-slate-400 mt-1.5">
              Only workspace Admins have permission to invite new collaborators and assign roles.
            </p>
          )}
        </form>

        {/* Member Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Collaborator</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="py-10 px-4 text-center text-slate-400">
                    {loadingMembers ? 'Loading workspace roster...' : 'No collaborators found in this workspace yet.'}
                  </td>
                </tr>
              ) : members.map((m) => {
                const u = m.userId;
                const isCurrentUser = Boolean(
                  (u?._id && user?._id && String(u._id) === String(user._id)) ||
                    (u?.firebaseUid && user?.firebaseUid && u.firebaseUid === user.firebaseUid) ||
                    (u?.email && user?.email && u.email.toLowerCase() === user.email.toLowerCase())
                );
                const nameDisplay = m.fullName || m.invitedName || (u?.name && !u.name.includes('@') ? u.name : null) || u?.name || (m.invitedEmail ? m.invitedEmail.split('@')[0] : 'Pending Teammate');
                const emailDisplay = u?.email || m.invitedEmail || '—';
                const initial = nameDisplay ? nameDisplay.charAt(0).toUpperCase() : 'U';
                const isInvited = m.status === 'INVITED';
                return (
                  <tr key={m._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-bold shadow-2xs shrink-0 ${
                          isInvited
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-gradient-to-br from-brand-100 to-indigo-100 border-brand-200 text-brand-700'
                        }`}>
                          {initial}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>{nameDisplay}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-1.5 py-0.5 rounded-full border border-brand-200">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{emailDisplay}</td>
                    <td className="py-3 px-4">
                      {isAdmin && !isCurrentUser ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m._id, e.target.value)}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-2xs"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        getRoleBadge(m.role)
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isInvited ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          INVITED (Pending)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {m.status || 'ACTIVE'}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleRoleChange(m._id, m.role === 'ADMIN' ? 'MANAGER' : 'ADMIN')}
                            className="text-xs text-brand-600 hover:text-brand-800 font-semibold transition-colors"
                          >
                            {m.role === 'ADMIN' ? 'Demote to Manager' : 'Promote to Admin'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Responsibility Matrix */}
      <div className="bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg space-y-4 border border-white/10">
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
          <ShieldCheck className="w-5 h-5 text-brand-400" />
          <h4 className="text-sm font-bold text-white tracking-wide">
            BRANDLENS AI GOVERNANCE ROLE MATRIX (SECTION 3.1)
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-1">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1.5 backdrop-blur-xs">
            <div className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              ADMIN
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Full control over organization settings, members, brand guidelines, facts, terminology libraries, and assets.
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1.5 backdrop-blur-xs">
            <div className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              MANAGER
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Manages review workflows, requests revisions, overrides rule findings with audit reasons, and issues final release sign-offs.
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1.5 backdrop-blur-xs">
            <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5" />
              REVIEWER
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Inspects cited evidence, tests claims against facts library, and records justified overrides with mandatory logging.
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1.5 backdrop-blur-xs">
            <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              CREATOR
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Submits draft copy, views explainable compliance findings, accepts inline fixes, and re-submits for verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
