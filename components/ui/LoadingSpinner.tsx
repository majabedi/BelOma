// components/ui/LoadingSpinner.tsx
// Generic loading spinner and skeleton components

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-slate-200 border-t-brand-600',
        sizes[size],
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-slate-200 rounded w-1/3" />
        <div className="h-2.5 bg-slate-100 rounded w-1/4" />
      </div>
      <div className="h-5 bg-slate-200 rounded-full w-16" />
      <div className="h-5 bg-slate-200 rounded-full w-14" />
      <div className="h-5 bg-slate-200 rounded-full w-10" />
    </div>
  );
}
