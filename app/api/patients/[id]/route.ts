// app/api/patients/[id]/route.ts
// GET /api/patients/[id] - fetch one patient with all related data

import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const patientId = parseInt(params.id, 10);
  if (isNaN(patientId)) {
    return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
  }

  try {
    const { rows: patients } = await sql`
      SELECT * FROM patients WHERE id = ${patientId}
    `;
    if (patients.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const [patient] = patients;

    const { rows: adherenceRecords } = await sql`
      SELECT * FROM adherence_records
      WHERE patient_id = ${patientId}
      ORDER BY date ASC
    `;

    const { rows: callRecords } = await sql`
      SELECT * FROM call_records
      WHERE patient_id = ${patientId}
      ORDER BY started_at DESC
    `;

    const { rows: alerts } = await sql`
      SELECT * FROM alerts
      WHERE patient_id = ${patientId}
      ORDER BY created_at DESC
    `;

    const { rows: notes } = await sql`
      SELECT * FROM notes
      WHERE patient_id = ${patientId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      patient: {
        ...patient,
        adherence_records: adherenceRecords,
        call_records: callRecords,
        alerts,
        notes,
        active_alert: alerts.find((a) => a.is_active) ?? null,
        latest_adherence: adherenceRecords.length > 0
          ? adherenceRecords[adherenceRecords.length - 1].adherence_score
          : null,
      },
    });
  } catch (error) {
    console.error(`GET /api/patients/${patientId} error:`, error);
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 });
  }
}
