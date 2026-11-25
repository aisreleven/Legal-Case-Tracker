import React from 'react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'up',
  onClick,
  accentColor = 'primary', // 'primary', 'gold', 'emerald', 'amber', 'rose'
}) => {
  const isClickable = Boolean(onClick);

  const colorStyles = {
    primary: {
      iconBg: 'bg-[#142B4A]/10 text-[#142B4A] dark:bg-sky-950/60 dark:text-sky-300',
      badge: 'text-[#142B4A]',
      ring: 'hover:border-[#142B4A]/30',
    },
    gold: {
      iconBg: 'bg-[#C6A15B]/15 text-[#B08B42] dark:bg-amber-950/60 dark:text-amber-300',
      badge: 'text-[#B08B42]',
      ring: 'hover:border-[#C6A15B]/40',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
      badge: 'text-emerald-600',
      ring: 'hover:border-emerald-300',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
      badge: 'text-amber-600',
      ring: 'hover:border-amber-300',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300',
      badge: 'text-rose-600',
      ring: 'hover:border-rose-300',
    }
  };

  const themeStyle = colorStyles[accentColor] || colorStyles.primary;

  return (
    <div
      onClick={onClick}
      className={`relative bg-white dark:bg-slate-900 rounded-xl p-5 border border-[#E5EAF0] dark:border-slate-800 shadow-sm transition-all duration-200 ${
        isClickable ? `cursor-pointer hover:shadow-md ${themeStyle.ring} transform hover:-translate-y-0.5` : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-bold text-[#142B4A] dark:text-white">
              {value}
            </span>
            {trend && (
              <span className={`text-xs font-medium flex items-center ${
                trendDirection === 'up' ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {trendDirection === 'up' ? '↑' : '↓'} {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl flex-shrink-0 ${themeStyle.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {isClickable && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span>Click to view details</span>
          <span className="text-[#C6A15B] font-semibold">→</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
