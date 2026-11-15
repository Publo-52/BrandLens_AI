import React from 'react';
import { History } from 'lucide-react';

export function AuditPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Audit Trail & Compliance Export</h2>
          <p className="text-sm text-slate-500">Immutable ledger of submissions, reviewer decisions, overrides, and approvals.</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
          Scheduled for Milestone 6 & 8
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
          <History className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Tamper-Evident Governance Log</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Provides verifiable pre-publication audit records: who approved what version, timestamps, 
          which checks were run deterministically vs using AI, and exportable compliance certificates.
        </p>
      </div>
    </div>
  );
}
