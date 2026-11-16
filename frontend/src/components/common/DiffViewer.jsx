import React, { useState, useMemo } from 'react';
import { computeWordDiff } from '../../utils/diff';
import { GitCompare, Columns, AlignJustify } from 'lucide-react';

export function DiffViewer({ oldText = '', newText = '', oldLabel = 'Original Draft (v1)', newLabel = 'Revised Draft (v2)' }) {
  const [viewMode, setViewMode] = useState('inline'); // 'inline' | 'split'

  const { diffTokens, addedCount, removedCount } = useMemo(() => {
    const tokens = computeWordDiff(oldText, newText);
    let added = 0;
    let removed = 0;
    tokens.forEach((t) => {
      if (t.type === 'added') added += t.value.trim().split(/\s+/).filter(Boolean).length;
      if (t.type === 'removed') removed += t.value.trim().split(/\s+/).filter(Boolean).length;
    });
    return { diffTokens: tokens, addedCount: added, removedCount: removed };
  }, [oldText, newText]);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Header Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <GitCompare className="w-4 h-4 text-brand-600" />
          <span>Visual Version Comparison</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
            +{addedCount} words
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono font-bold">
            -{removedCount} words
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('inline')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'inline' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlignJustify className="w-3.5 h-3.5" />
            <span>Unified Diff</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'split' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="p-4 text-xs font-mono leading-relaxed">
        {viewMode === 'inline' ? (
          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg whitespace-pre-wrap">
            {diffTokens.map((token, idx) => {
              if (token.type === 'added') {
                return (
                  <span key={idx} className="bg-emerald-100 text-emerald-900 font-semibold px-1 py-0.5 rounded mx-0.5 border border-emerald-300">
                    {token.value}
                  </span>
                );
              }
              if (token.type === 'removed') {
                return (
                  <span key={idx} className="bg-rose-100 text-rose-800 line-through px-1 py-0.5 rounded mx-0.5 opacity-80 border border-rose-300">
                    {token.value}
                  </span>
                );
              }
              return <span key={idx} className="text-slate-800">{token.value}</span>;
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-lg p-4 bg-rose-50/20">
              <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-2 pb-1 border-b border-rose-100 flex items-center justify-between">
                <span>{oldLabel}</span>
                <span className="text-[10px] text-rose-600">Base</span>
              </div>
              <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                {oldText}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-emerald-50/20">
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2 pb-1 border-b border-emerald-100 flex items-center justify-between">
                <span>{newLabel}</span>
                <span className="text-[10px] text-emerald-600 font-bold">Target</span>
              </div>
              <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                {newText}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
