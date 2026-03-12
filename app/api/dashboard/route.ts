// app/api/dashboard/route.ts
// GET /api/dashboard - fetch summary statistics for the dashboard

import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Total patients
    const { rows: totalRows } = await sql`SELECT COUNT(*) as count FROM patients`;
    const total_patients = parseInt(totalRows[0].count, 10);

    // Calls today (UTC)
    const { rows: callsToday } = await sql`
      SELECT COUNT(*) as count FROM call_records
      WHERE DATE(started_at) = CURRENT_DATE
    `;
    const calls_today = parseInt(callsToday[0].count, 10);

    // Patients with active red/yellow alerts
    const { rows: withAlerts } = await sql`
      SELECT COUNT(DISTINCT patient_id) as count FROM alerts
      WHERE is_active = true AND level IN ('red', 'yellow')
    `;
    const patients_with_alerts = parseInt(withAlerts[0].count, 10);

    // Average adherence (from latest score per patient)
    const { rows: avgRows } = await sql`
      SELECT ROUND(AVG(latest_score)) as avg_adherence FROM (
        SELECT DISTINCT ON (patient_id) adherence_score as latest_score
        FROM adherence_records
        ORDER BY patient_id, date DESC
      ) sub
    `;
    const avg_adherence = parseInt(avgRows[0].avg_adherence ?? '0', 10);

    // Recent activity feed (last 10 events across calls, alerts, notes)
    const { rows: recentActivity } = await sql`
      SELECT 'call' as type, cr.created_at, p.full_name as patient_name, cr.outcome as detail, cr.id
      FROM call_records cr JOIN patients p ON p.id = cr.patient_id
      UNION ALL
      SELECT 'note' as type, n.created_at, p.full_name as patient_name, n.type as detail, n.id
      FROM notes n JOIN patients p ON p.id = n.patient_id
      UNION ALL
      SELECT 'alert' as type, a.created_at, p.full_name as patient_name, a.level as detail, a.id
      FROM alerts a JOIN patients p ON p.id = a.patient_id
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      stats: { total_patients, calls_today, patients_with_alerts, avg_adherence },
      recent_activity: recentActivity,
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
