// components/ui/StatCard.tsx
// Dashboard summary stat card component

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-brand-600',
  iconBg = 'bg-brand-50',
  className,
}: StatCardProps) {
  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 leading-none">{value}</p>
          {subtitle && (
            <p className="mt-1.5 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        )}
      </div>
    </div>
  );
}
