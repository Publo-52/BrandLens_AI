import React from 'react';
import { BarChart3 } from 'lucide-react';

export function InsightsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Governance Insights</h2>
          <p className="text-sm text-slate-500">Track recurring mistakes, frequently overruled rules, and guideline ambiguity.</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
          Scheduled for Milestone 7
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Learn & Improve Analytics</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Aggregates actual recorded review events: most violated brand rules, repeat errors by channel or agency, 
          and rules frequently overruled by human reviewers to highlight guidelines in need of clarification.
        </p>
      </div>
    </div>
  );
}
