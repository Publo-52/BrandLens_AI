import React, { useState, useEffect } from 'react';
import { Building2, X, Plus, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { workspaceApi } from '../lib/api';
import { ModalPortal } from './common/ModalPortal';

export function CreateWorkspaceModal({ isOpen, onClose, canClose = true }) {
  const { user, refreshSession, switchOrg } = useAuth();
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !canClose || !onClose) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canClose, onClose, loading]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      setError('Please provide a name for your new workspace.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await workspaceApi.createWorkspace({
        name: workspaceName.trim(),
      });

      if (refreshSession) {
        await refreshSession();
      }

      const createdOrgId = result.workspace?._id || result.organisation?._id;
      if (createdOrgId && switchOrg) {
        switchOrg(createdOrgId);
      }

      setWorkspaceName('');
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Failed to create workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={canClose ? onClose : undefined}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-workspace-title"
        onClick={() => {
          if (canClose && onClose && !loading) onClose();
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm overflow-y-auto"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl relative text-slate-900 my-auto animate-in fade-in zoom-in-95 duration-200"
        >
        {/* Close Button (if allowed) */}
        {canClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            title="Close (Esc)"
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-brand-500/25 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 id="create-workspace-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Create Workspace</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/80 font-bold">
                ADMIN
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Establish an isolated tenant environment with dedicated brand rules.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Workspace / Organisation Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g., NovaTech Global or Marketing Hub"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-brand-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Workspace Creator Permissions</span>
            </p>
            <p className="text-slate-500">
              As the workspace creator, your account ({user?.email || 'you'}) will be automatically assigned the <strong>ADMIN</strong> role with authority to invite collaborators and configure brand knowledge.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !workspaceName.trim()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Creating Workspace...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
}

export default CreateWorkspaceModal;
