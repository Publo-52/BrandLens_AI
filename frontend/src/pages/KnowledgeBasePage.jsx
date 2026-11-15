import React from 'react';
import { BookOpen } from 'lucide-react';

export function KnowledgeBasePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Brand Knowledge Base</h2>
          <p className="text-sm text-slate-500">Manage versioned guidelines, approved facts, terminology rules, and assets.</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
          Scheduled for Milestone 3
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Source of Truth Administration</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Brand Administrators will configure versioned guidelines (tone, voice, legal rules), approved facts library, 
          deterministic terminology dictionaries (preferred vs banned terms), and visual assets (palettes, logos).
        </p>
      </div>
    </div>
  );
}
