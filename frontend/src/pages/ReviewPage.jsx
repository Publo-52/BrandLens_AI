import React from 'react';
import { FileCheck2, AlertCircle } from 'lucide-react';

export function ReviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Content Review Workspace</h2>
          <p className="text-sm text-slate-500">Submit and verify content drafts against approved brand rules.</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
          Scheduled for Milestone 4 & 5
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
          <FileCheck2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Review Engine & Content Intake</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          In Milestones 4 and 5, creators will submit pasted text, PDF, DOCX, and JPG/PNG documents here. 
          The review engine will perform deterministic checks (banned terms, product naming, WCAG contrast) 
          and grounded AI checks (tone, messaging, approved claim citations) with structured findings and rewrite suggestions.
        </p>
      </div>
    </div>
  );
}
