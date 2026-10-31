import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = (status || '').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['ACTIVE', 'PAID', 'SUCCESS', 'ACCEPTED'].includes(s)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['CONFIRMED', 'SENT'].includes(s)) {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (['PAUSED', 'PARTIALLY_PAID', 'PENDING', 'WARNING'].includes(s)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['OVERDUE', 'CANCELLED', 'FAILED', 'ERROR'].includes(s)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['CLOSED', 'EXPIRED', 'ARCHIVED', 'DRAFT'].includes(s)) {
    styles = 'bg-slate-100 text-slate-600 border-slate-200';
  }

  const dotColor = ['ACTIVE', 'PAID', 'SUCCESS', 'ACCEPTED'].includes(s)
    ? 'bg-emerald-500'
    : ['OVERDUE', 'CANCELLED', 'FAILED'].includes(s)
    ? 'bg-rose-500'
    : ['PAUSED', 'PARTIALLY_PAID', 'PENDING'].includes(s)
    ? 'bg-amber-500'
    : 'bg-indigo-500';

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${styles} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {s.replace(/_/g, ' ')}
    </span>
  );
};
