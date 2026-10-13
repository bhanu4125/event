import React from 'react';

const statusConfig = {
  draft: {
    label: 'Draft',
    bg: 'bg-slate-800/80',
    text: 'text-slate-300',
    border: 'border-slate-700',
    dot: 'bg-slate-400',
  },
  pending_approval: {
    label: 'Pending Approval',
    bg: 'bg-amber-950/60',
    text: 'text-amber-300',
    border: 'border-amber-800/60',
    dot: 'bg-amber-400 animate-pulse',
  },
  changes_requested: {
    label: 'Changes Requested',
    bg: 'bg-orange-950/60',
    text: 'text-orange-300',
    border: 'border-orange-800/60',
    dot: 'bg-orange-400',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-300',
    border: 'border-emerald-800/60',
    dot: 'bg-emerald-400',
  },
  published: {
    label: 'Live / Published',
    bg: 'bg-indigo-950/60',
    text: 'text-indigo-300',
    border: 'border-indigo-800/60',
    dot: 'bg-indigo-400 shadow-[0_0_8px_#6366f1]',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-rose-950/60',
    text: 'text-rose-300',
    border: 'border-rose-800/60',
    dot: 'bg-rose-400',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-zinc-900/80',
    text: 'text-zinc-400 line-through',
    border: 'border-zinc-800 border-dashed',
    dot: 'bg-zinc-500',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-teal-950/60',
    text: 'text-teal-300',
    border: 'border-teal-800/60',
    dot: 'bg-teal-400',
  },
};

const StatusBadge = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || statusConfig.draft;
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm font-semibold'
      : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md transition-all ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
