import React from 'react';

export function StatusBadge({ status, label }) {
  const getColors = () => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'operational':
      case 'connected':
      case 'reachable':
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'degraded':
      case 'pending':
      case 'in_review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'unreachable':
      case 'disconnected':
      case 'rejected':
      case 'error':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getDotColor = () => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'operational':
      case 'connected':
      case 'reachable':
      case 'approved':
        return 'bg-emerald-500';
      case 'degraded':
      case 'pending':
      case 'in_review':
        return 'bg-amber-500';
      case 'unreachable':
      case 'disconnected':
      case 'rejected':
      case 'error':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColors()}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
      {label || status}
    </span>
  );
}
