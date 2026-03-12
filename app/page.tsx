// app/page.tsx
// Dashboard page — shows summary stats, alerts, recent activity, and quick patient list

import { sql } from '@vercel/postgres';
import Link from 'next/link';
import {
  Users,
  Phone,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Clock,
  FileText,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import { formatDate, formatDuration, getAge } from '@/lib/utils';

// Fetch dashboard stats server-side
async function getDashboardData() {
  try {
    const { rows: totalRows } = await sql`SELECT COUNT(*) as count FROM patients`;
    const total_patients = parseInt(totalRows[0].count, 10);

    const { rows: callsToday } = await sql`
      SELECT COUNT(*) as count FROM call_records WHERE DATE(started_at) = CURRENT_DATE
    `;
    const calls_today = parseInt(callsToday[0].count, 10);

    const { rows: withAlerts } = await sql`
      SELECT COUNT(DISTINCT patient_id) as count FROM alerts
      WHERE is_active = true AND level IN ('red', 'yellow')
    `;
    const patients_with_alerts = parseInt(withAlerts[0].count, 10);

    const { rows: avgRows } = await sql`
      SELECT ROUND(AVG(latest_score))::int as avg_adherence FROM (
        SELECT DISTINCT ON (patient_id) adherence_score as latest_score
        FROM adherence_records ORDER BY patient_id, date DESC
      ) sub
    `;
    const avg_adherence = avgRows[0].avg_adherence ?? 0;

    // Patients with red alerts first
    const { rows: patients } = await sql`
      SELECT p.*, ar.adherence_score AS latest_adherence,
        a.level AS alert_level, a.reason AS alert_reason
      FROM patients p
      LEFT JOIN LATERAL (
        SELECT adherence_score FROM adherence_records
        WHERE patient_id = p.id ORDER BY date DESC LIMIT 1
      ) ar ON true
      LEFT JOIN LATERAL (
        SELECT level, reason FROM alerts
        WHERE patient_id = p.id AND is_active = true ORDER BY created_at DESC LIMIT 1
      ) a ON true
      ORDER BY
        CASE WHEN a.level = 'red' THEN 0 WHEN a.level = 'yellow' THEN 1 ELSE 2 END,
        p.full_name ASC
    `;

    // Recent activity
    const { rows: activity } = await sql`
      SELECT 'call' as type, cr.created_at, p.full_name as patient_name,
        cr.outcome as detail, cr.id, p.id as patient_id
      FROM call_records cr JOIN patients p ON p.id = cr.patient_id
      UNION ALL
      SELECT 'note' as type, n.created_at, p.full_name as patient_name,
        n.type as detail, n.id, p.id as patient_id
      FROM notes n JOIN patients p ON p.id = n.patient_id
      ORDER BY created_at DESC LIMIT 8
    `;

    return { total_patients, calls_today, patients_with_alerts, avg_adherence, patients, activity };
  } catch {
    return null;
  }
}

function alertBadgeVariant(level: string) {
  if (level === 'red') return 'red';
  if (level === 'yellow') return 'yellow';
  return 'green';
}

function riskBadgeVariant(level: string) {
  if (level === 'high') return 'red';
  if (level === 'medium') return 'yellow';
  return 'green';
}

function activityIcon(type: string) {
  if (type === 'call') return <Phone className="w-3.5 h-3.5 text-brand-500" />;
  return <FileText className="w-3.5 h-3.5 text-slate-400" />;
}

function activityLabel(activity: { type: string; detail: string }) {
  if (activity.type === 'call') {
    const labels: Record<string, string> = {
      stable: 'Gesprek — Stabiel',
      needs_review: 'Gesprek — Opvolging nodig',
      urgent: 'Gesprek — Dringend',
      no_contact: 'Gesprek — Geen contact',
      completed: 'Gesprek — Afgerond',
    };
    return labels[activity.detail] ?? 'Gesprek';
  }
  return activity.detail === 'ai_summary' ? 'AI Samenvatting' : 'Notitie';
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="p-8">
        <div className="card p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-800">Database niet verbonden</h2>
          <p className="text-sm text-slate-500 mt-1">
            Zorg ervoor dat de omgevingsvariabelen zijn ingesteld en{' '}
            <code className="bg-slate-100 px-1 rounded text-xs">POST /api/seed</code> is uitgevoerd.
          </p>
        </div>
      </div>
    );
  }

  const { total_patients, calls_today, patients_with_alerts, avg_adherence, patients, activity } = data;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overzicht patiëntzorg en gespreksstatus</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Totaal patiënten"
          value={total_patients}
          icon={Users}
          iconBg="bg-brand-50"
          iconColor="text-brand-600"
          subtitle="Actief in het systeem"
        />
        <StatCard
          title="Gesprekken vandaag"
          value={calls_today}
          icon={Phone}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          subtitle="Afgerond vandaag"
        />
        <StatCard
          title="Patiënten met alert"
          value={patients_with_alerts}
          icon={AlertTriangle}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
          subtitle="Rood of geel"
        />
        <StatCard
          title="Gem. adherentie"
          value={`${avg_adherence}%`}
          icon={TrendingUp}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          subtitle="Alle patiënten"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients table */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Patiënten overzicht</h2>
            <Link
              href="/patients"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              Alles bekijken <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Naam</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Risico</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Adherentie</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-brand-700">
                            {patient.full_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{patient.full_name}</p>
                          <p className="text-xs text-slate-400">{patient.language.toUpperCase()} · {getAge(patient.birth_year)} jr</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={riskBadgeVariant(patient.risk_level) as 'red' | 'yellow' | 'green'} dot>
                        {patient.risk_level === 'high' ? 'Hoog' : patient.risk_level === 'medium' ? 'Gemiddeld' : 'Laag'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      {patient.latest_adherence !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full w-16">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${patient.latest_adherence}%`,
                                background: patient.latest_adherence >= 90 ? '#16a34a'
                                  : patient.latest_adherence >= 70 ? '#ca8a04'
                                  : '#dc2626',
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600">
                            {patient.latest_adherence}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {patient.alert_level ? (
                        <Badge variant={alertBadgeVariant(patient.alert_level) as 'red' | 'yellow' | 'green'} dot>
                          {patient.alert_level === 'red' ? 'Urgent' : patient.alert_level === 'yellow' ? 'Opvolging' : 'Stabiel'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent activity feed */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Recente activiteit</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {activity.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                Geen recente activiteit
              </div>
            )}
            {activity.map((item, i) => (
              <Link
                key={i}
                href={`/patients/${item.patient_id}`}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mt-0.5">
                  {activityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{item.patient_name}</p>
                  <p className="text-xs text-slate-500">{activityLabel(item)}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 flex-shrink-0 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatDate(item.created_at)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
