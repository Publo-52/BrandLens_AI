import React from 'react';
import { CheckSquare2 } from 'lucide-react';

export function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Approval Queue</h2>
          <p className="text-sm text-slate-500">Human review, comments, change requests, justified overrides, and sign-off.</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
          Scheduled for Milestone 6
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckSquare2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Authorised Reviewer & Manager Workflow</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Enforces human governance. Managers and reviewers inspect cited findings, add comments, 
          record mandatory justification reasons when overriding AI flags, and lock approved versions for release.
        </p>
      </div>
    </div>
  );
}
