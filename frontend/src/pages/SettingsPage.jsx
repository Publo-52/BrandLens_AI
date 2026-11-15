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
  RefreshCw 
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
        { email: inviteEmail, name: inviteName, role: inviteRole },
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
      await loadMembers();
    } catch (err) {
      setError(err.message || 'Failed to update role');
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

  const isAdmin = activeRole === 'ADMIN';
  const isManager = activeRole === 'MANAGER';
  const canManageMembers = isAdmin || isManager;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Workspace Settings & Roles</h2>
          <p className="text-sm text-slate-500">
            Multi-tenant organisation management and Server-Side Role-Based Access Control (RBAC).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Your Role: {activeRole}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 font-semibold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800 font-semibold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Workspace General Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brand-600" />
          Workspace Configuration
        </h3>
        <form onSubmit={handleUpdateOrg} className="max-w-md space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Workspace Name</label>
            <input
              type="text"
              value={orgName}
              disabled={!isAdmin}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Workspace Slug (Tenant Identifier)</label>
            <input
              type="text"
              readOnly
              value={activeOrg?.slug || 'unknown'}
              className="w-full px-3 py-2 text-sm bg-slate-50 text-slate-500 border border-slate-200 rounded-lg font-mono text-xs cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Guarantees strict multi-tenant isolation. All submissions, guidelines, and reviews are scoped by this ID.
            </p>
          </div>
          {isAdmin && (
            <button
              type="submit"
              disabled={updatingOrg}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{updatingOrg ? 'Saving...' : 'Update Workspace Details'}</span>
            </button>
          )}
        </form>
      </div>

      {/* Members & RBAC Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              Workspace Members & Access Control
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage who has access to this brand workspace and their governance permissions.
            </p>
          </div>
          <button
            onClick={loadMembers}
            className="self-start sm:self-center p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
            title="Refresh members list"
          >
            <RefreshCw className={`w-4 h-4 ${loadingMembers ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>

        {/* Invite Member Form (ADMIN or MANAGER) */}
        {canManageMembers ? (
          <form onSubmit={handleInvite} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <UserPlus className="w-4 h-4 text-brand-600" />
              <span>Invite New Collaborator</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Full Name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <input
                type="email"
                required
                placeholder="email@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium"
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r} disabled={r === 'ADMIN' && !isAdmin}>
                    {r} {r === 'ADMIN' && !isAdmin ? '(Admin only)' : ''}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{inviting ? 'Inviting...' : 'Add Member'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Only workspace Admins and Managers have permission to invite new members.</span>
          </div>
        )}

        {/* Member Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                {isAdmin && <th className="py-2.5 px-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => {
                const u = m.userId;
                const isCurrentUser = u?._id === user?._id;
                return (
                  <tr key={m._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {u?.name || 'Unnamed User'}
                      {isCurrentUser && <span className="ml-2 text-[10px] text-brand-600 font-normal">(You)</span>}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{u?.email}</td>
                    <td className="py-3 px-3">
                      {isAdmin && !isCurrentUser ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m._id, e.target.value)}
                          className="px-2 py-1 text-xs border border-slate-200 rounded font-semibold bg-white text-slate-700"
                        >
                          {ALL_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {m.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {m.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-3 text-right">
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleRoleChange(m._id, m.role === 'ADMIN' ? 'MANAGER' : 'ADMIN')}
                            className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
                          >
                            {m.role === 'ADMIN' ? 'Demote to Manager' : 'Make Admin'}
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
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm space-y-4">
        <h4 className="text-sm font-semibold text-brand-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          BRANDLENS AI ROLE PERMISSION MATRIX (SECTION 3.1)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
            <div className="font-bold text-white mb-1">ADMIN</div>
            <p className="text-slate-300 text-[11px]">
              Full control over workspace settings, users, brand guidelines, facts, terminology, and asset libraries.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
            <div className="font-bold text-white mb-1">MANAGER</div>
            <p className="text-slate-300 text-[11px]">
              Manages review assignments, workflow transitions, requests changes, and issues final release sign-offs.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
            <div className="font-bold text-white mb-1">REVIEWER</div>
            <p className="text-slate-300 text-[11px]">
              Inspects cited evidence, comments on drafts, and records justified overrides with mandatory reason logging.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
            <div className="font-bold text-white mb-1">CREATOR</div>
            <p className="text-slate-300 text-[11px]">
              Submits draft content, views explainable findings, accepts/edits/rejects suggestions, and resubmits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
