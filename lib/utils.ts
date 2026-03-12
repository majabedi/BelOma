// lib/utils.ts
// General utility functions and Tailwind class merging helper

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertLevel, RiskLevel } from './types';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Map an alert level to a Tailwind color class */
export function alertLevelColor(level: AlertLevel): string {
  switch (level) {
    case 'red':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'yellow':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'green':
      return 'text-green-700 bg-green-50 border-green-200';
  }
}

/** Map a risk level to a Tailwind badge color */
export function riskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'high':
      return 'text-red-700 bg-red-100';
    case 'medium':
      return 'text-yellow-700 bg-yellow-100';
    case 'low':
      return 'text-green-700 bg-green-100';
  }
}

/** Compute an alert level from adherence score */
export function computeAlertLevel(score: number | null): AlertLevel {
  if (score === null) return 'yellow';
  if (score < 70) return 'red';
  if (score < 90) return 'yellow';
  return 'green';
}

/** Format a date string to a human-readable format */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format duration in seconds to mm:ss */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Calculate age from birth year */
export function getAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}
