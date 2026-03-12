// app/api/patients/route.ts
// GET /api/patients - list all patients with their latest status

import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT
        p.*,
        ar.adherence_score AS latest_adherence,
        a.level AS alert_level,
        a.reason AS alert_reason,
        a.id AS alert_id,
        cr.started_at AS last_call_at,
        cr.call_status AS last_call_status,
        cr.outcome AS last_call_outcome
      FROM patients p
      LEFT JOIN LATERAL (
        SELECT adherence_score FROM adherence_records
        WHERE patient_id = p.id
        ORDER BY date DESC LIMIT 1
      ) ar ON true
      LEFT JOIN LATERAL (
        SELECT id, level, reason FROM alerts
        WHERE patient_id = p.id AND is_active = true
        ORDER BY created_at DESC LIMIT 1
      ) a ON true
      LEFT JOIN LATERAL (
        SELECT started_at, call_status, outcome FROM call_records
        WHERE patient_id = p.id
        ORDER BY started_at DESC LIMIT 1
      ) cr ON true
      ORDER BY p.full_name ASC
    `;

    return NextResponse.json({ patients: rows });
  } catch (error) {
    console.error('GET /api/patients error:', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}
