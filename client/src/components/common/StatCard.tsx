import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'brand' | 'indigo' | 'emerald' | 'amber' | 'rose';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  to?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'brand',
  trend,
  to,
}) => {
  const colorStyles = {
    brand: 'bg-brand-50 text-brand-600 border-brand-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const content = (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm transition-all duration-200 ${
      to ? 'hover:shadow-md hover:border-slate-300 cursor-pointer group' : 'hover:shadow-md'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl border transition-transform duration-200 ${colorStyles[color]} ${to ? 'group-hover:scale-105' : ''}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight ${to ? 'group-hover:text-brand-600 transition-colors' : ''}`}>{value}</span>
        {trend && (
          <span className={`text-xs font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
};
