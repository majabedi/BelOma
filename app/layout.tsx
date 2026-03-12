// app/layout.tsx
// Root layout with sidebar navigation

import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'BelOma — Patient Dashboard',
  description: 'Automated patient calling and medication adherence dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head />
      <body className="flex h-screen overflow-hidden bg-slate-50">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
