import React from 'react';

const StatusBadge = ({ status, type = 'status' }) => {
  if (!status) return null;

  const normalized = status.toLowerCase();

  // Color mapping based on status
  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (normalized === 'active') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    dotColor = 'bg-emerald-500';
  } else if (normalized === 'pending') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    dotColor = 'bg-amber-500';
  } else if (normalized === 'closed' || normalized === 'completed') {
    styles = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
    dotColor = 'bg-blue-500';
  } else if (normalized === 'scheduled') {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800';
    dotColor = 'bg-indigo-500';
  } else if (normalized === 'postponed') {
    styles = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800';
    dotColor = 'bg-orange-500';
  } else if (normalized === 'cancelled' || normalized === 'suspended') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    dotColor = 'bg-rose-500';
  } else if (normalized === 'high') {
    styles = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 font-semibold';
    dotColor = 'bg-red-500';
  } else if (normalized === 'medium') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    dotColor = 'bg-amber-500';
  } else if (normalized === 'low') {
    styles = 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
    dotColor = 'bg-sky-500';
  } else if (normalized === 'admin') {
    styles = 'bg-[#142B4A]/10 text-[#142B4A] border-[#142B4A]/20 dark:bg-sky-900/40 dark:text-sky-300';
    dotColor = 'bg-[#142B4A]';
  } else if (normalized === 'lawyer') {
    styles = 'bg-[#C6A15B]/15 text-[#92732B] border-[#C6A15B]/30 dark:bg-amber-900/40 dark:text-amber-300';
    dotColor = 'bg-[#C6A15B]';
  } else if (normalized === 'client') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
    dotColor = 'bg-emerald-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {status}
    </span>
  );
};

export default StatusBadge;
