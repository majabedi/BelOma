'use client';
// components/layout/Sidebar.tsx
// Main navigation sidebar

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Phone,
  Activity,
  Settings,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patients', label: 'Patiënten', icon: Users },
  { href: '/calls', label: 'Gesprekken', icon: Phone },
  { href: '/activity', label: 'Activiteit', icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 h-screen bg-white border-r border-slate-100 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-slate-900 tracking-tight">BelOma</span>
          <p className="text-[10px] text-slate-400 leading-tight">Patient Care Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'sidebar-nav-item',
                isActive ? 'active' : 'text-slate-600'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-100">
        <Link href="/settings" className={cn('sidebar-nav-item text-slate-600')}>
          <Settings className="w-4 h-4 flex-shrink-0" />
          Instellingen
        </Link>
        <div className="mt-4 mx-3 p-3 rounded-lg bg-brand-50 border border-brand-100">
          <p className="text-[11px] font-semibold text-brand-700">Demo modus</p>
          <p className="text-[10px] text-brand-500 mt-0.5">Alle gesprekken zijn gesimuleerd</p>
        </div>
      </div>
    </aside>
  );
}
