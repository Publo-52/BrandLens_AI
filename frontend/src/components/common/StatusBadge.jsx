import React, { memo } from 'react';

const STATUS_STYLES = {
  healthy:       { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  operational:   { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  connected:     { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  reachable:     { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  approved:      { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  degraded:      { badge: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  pending:       { badge: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  in_review:     { badge: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  unreachable:   { badge: 'bg-rose-50 text-rose-700 border-rose-200',         dot: 'bg-rose-500' },
  disconnected:  { badge: 'bg-rose-50 text-rose-700 border-rose-200',         dot: 'bg-rose-500' },
  rejected:      { badge: 'bg-rose-50 text-rose-700 border-rose-200',         dot: 'bg-rose-500' },
  error:         { badge: 'bg-rose-50 text-rose-700 border-rose-200',         dot: 'bg-rose-500' },
};

const DEFAULT_STYLE = { badge: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' };

export const StatusBadge = memo(function StatusBadge({ status, label }) {
  const style = STATUS_STYLES[status?.toLowerCase()] || DEFAULT_STYLE;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label || status}
    </span>
  );
});
