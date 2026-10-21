import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['published', 'completed', 'graded', 'present', 'active'].includes(norm)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['draft', 'in_progress', 'late', 'pending'].includes(norm)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['submitted', 'resubmitted'].includes(norm)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (['absent', 'inactive', 'closed', 'dropped'].includes(norm)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${styles} ${padding}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span className="capitalize">{status.replace('_', ' ')}</span>
    </span>
  );
};
