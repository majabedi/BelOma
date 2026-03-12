// app/activity/page.tsx
// Recent activity feed page (stub)

import Link from 'next/link';
import { sql } from '@vercel/postgres';
import { Activity, Phone, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

async function getActivity() {
  try {
    const { rows } = await sql`
      SELECT 'call' as type, cr.created_at, p.full_name as patient_name,
        cr.outcome as detail, cr.id, p.id as patient_id, cr.summary as content
      FROM call_records cr JOIN patients p ON p.id = cr.patient_id
      UNION ALL
      SELECT 'note' as type, n.created_at, p.full_name as patient_name,
        n.type as detail, n.id, p.id as patient_id, n.content
      FROM notes n JOIN patients p ON p.id = n.patient_id
      ORDER BY created_at DESC LIMIT 30
    `;
    return rows;
  } catch { return []; }
}

const OUTCOME_LABELS: Record<string, string> = {
  stable: 'Stabiel', needs_review: 'Opvolging nodig',
  urgent: 'Dringend', no_contact: 'Geen contact', completed: 'Afgerond',
};

export default async function ActivityPage() {
  const activity = await getActivity();
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recente activiteit</h1>
        <p className="text-sm text-slate-500 mt-1">Chronologisch overzicht van gesprekken en notities</p>
      </div>
      <div className="card divide-y divide-slate-50">
        {activity.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Geen activiteit gevonden</p>
        )}
        {activity.map((item, i) => (
          <div key={i} className="flex gap-4 px-5 py-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mt-0.5">
              {item.type === 'call'
                ? <Phone className="w-4 h-4 text-brand-500" />
                : <FileText className="w-4 h-4 text-slate-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link href={`/patients/${item.patient_id}`} className="text-sm font-semibold text-slate-800 hover:text-brand-700">
                  {item.patient_name}
                </Link>
                <span className="text-xs text-slate-400">—</span>
                <span className="text-xs text-slate-600">
                  {item.type === 'call'
                    ? `Gesprek: ${OUTCOME_LABELS[item.detail] ?? item.detail}`
                    : item.detail === 'ai_summary' ? 'AI Samenvatting' : 'Notitie'}
                </span>
              </div>
              {item.content && (
                <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">{item.content}</p>
              )}
              <p className="mt-1 text-[10px] text-slate-400">{formatDate(item.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
