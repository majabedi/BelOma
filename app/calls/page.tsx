// app/calls/page.tsx
// Calls overview page (stub – can be extended later)

import Link from 'next/link';
import { sql } from '@vercel/postgres';
import { Phone, Clock, CheckCircle, XCircle, AlertTriangle, PhoneOff } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { formatDate, formatDuration } from '@/lib/utils';

async function getCallRecords() {
  try {
    const { rows } = await sql`
      SELECT cr.*, p.full_name FROM call_records cr
      JOIN patients p ON p.id = cr.patient_id
      ORDER BY cr.started_at DESC LIMIT 50
    `;
    return rows;
  } catch { return []; }
}

const OUTCOME_LABELS: Record<string, string> = {
  stable: 'Stabiel', needs_review: 'Opvolging nodig',
  urgent: 'Dringend', no_contact: 'Geen contact', completed: 'Afgerond',
};

function outcomeVariant(o: string | null) {
  if (o === 'stable') return 'green';
  if (o === 'urgent') return 'red';
  if (o === 'needs_review') return 'yellow';
  return 'slate';
}

export default async function CallsPage() {
  const calls = await getCallRecords();
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gesprekken</h1>
        <p className="text-sm text-slate-500 mt-1">Alle geregistreerde gesprekken</p>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Patiënt</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Datum</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Duur</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Uitkomst</th>
            </tr>
          </thead>
          <tbody>
            {calls.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-400">Geen gesprekken gevonden</td></tr>
            )}
            {calls.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <Link href={`/patients/${c.patient_id}`} className="text-sm font-medium text-brand-700 hover:underline">
                    {c.full_name}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-500">{formatDate(c.started_at)}</td>
                <td className="px-4 py-3.5 text-sm text-slate-500">{formatDuration(c.duration_seconds)}</td>
                <td className="px-4 py-3.5">
                  {c.outcome ? (
                    <Badge variant={outcomeVariant(c.outcome) as 'green' | 'red' | 'yellow' | 'slate'} dot>
                      {OUTCOME_LABELS[c.outcome]}
                    </Badge>
                  ) : (
                    <Badge variant="slate">Onbekend</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
