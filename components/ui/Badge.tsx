// components/ui/Badge.tsx
// Reusable badge component for status labels

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'yellow' | 'red' | 'blue' | 'slate' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

const variantStyles = {
  green: 'text-green-700 bg-green-50 border-green-200',
  yellow: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  red: 'text-red-700 bg-red-50 border-red-200',
  blue: 'text-blue-700 bg-blue-50 border-blue-200',
  slate: 'text-slate-600 bg-slate-100 border-slate-200',
  purple: 'text-purple-700 bg-purple-50 border-purple-200',
};

const dotColors = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  slate: 'bg-slate-400',
  purple: 'bg-purple-500',
};

export default function Badge({
  children,
  variant = 'slate',
  size = 'sm',
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}
