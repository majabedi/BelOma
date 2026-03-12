// app/api/calls/route.ts
// POST /api/calls - trigger a mock call for a patient
// Designed to be replaceable with real ElevenLabs / Twilio logic later

import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

// Mock AI summaries for the demo
const MOCK_SUMMARIES: Record<string, string[]> = {
  stable: [
    'Patiënt heeft medicatie regelmatig ingenomen. Geen klachten gemeld. Schema wordt goed gevolgd.',
    'Goed gesprek. Adherentie is stabiel. Patiënt begrijpt het belang van regelmaat en voelt zich goed.',
    'Positieve terugkoppeling. Patiënt volgt het medicatieschema correct op.',
  ],
  needs_review: [
    'Patiënt meldt af en toe bijwerkingen. Medicatie soms vergeten. Opvolggesprek aanbevolen binnen 1 week.',
    'Adherentie is wisselend. Patiënt heeft moeite met het onthouden van innametijden. Herinnering ingesteld.',
    'Patiënt geeft aan vermoeid te zijn. Overlegt met arts aanbevolen.',
  ],
  no_contact: [
    'Geen gehoor. Voicemail ingesproken. Tweede poging gepland.',
    'Niet bereikbaar. Schriftelijke herinnering verstuurd.',
  ],
  urgent: [
    'Dringend: patiënt meldt ernstige bijwerkingen. Directe medische opvolging vereist.',
    'Adherentie is significant gedaald. Patiënt voelt zich niet goed. Huisarts geïnformeerd.',
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Simulate a call result. In production, this would call ElevenLabs / Twilio
 * and return the actual result via webhook.
 */
function simulateCall(): {
  status: string;
  outcome: string;
  durationSeconds: number | null;
  summary: string;
} {
  const rand = Math.random();

  if (rand < 0.1) {
    // 10% – no answer
    return {
      status: 'no_answer',
      outcome: 'no_contact',
      durationSeconds: null,
      summary: pickRandom(MOCK_SUMMARIES.no_contact),
    };
  } else if (rand < 0.2) {
    // 10% – urgent
    return {
      status: 'completed',
      outcome: 'urgent',
      durationSeconds: Math.floor(Math.random() * 300) + 120,
      summary: pickRandom(MOCK_SUMMARIES.urgent),
    };
  } else if (rand < 0.5) {
    // 30% – needs review
    return {
      status: 'completed',
      outcome: 'needs_review',
      durationSeconds: Math.floor(Math.random() * 200) + 100,
      summary: pickRandom(MOCK_SUMMARIES.needs_review),
    };
  } else {
    // 50% – stable
    return {
      status: 'completed',
      outcome: 'stable',
      durationSeconds: Math.floor(Math.random() * 180) + 60,
      summary: pickRandom(MOCK_SUMMARIES.stable),
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const patientId = parseInt(body.patient_id, 10);

    if (isNaN(patientId)) {
      return NextResponse.json({ error: 'Invalid patient_id' }, { status: 400 });
    }

    // Verify patient exists
    const { rows: patients } = await sql`SELECT id FROM patients WHERE id = ${patientId}`;
    if (patients.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Simulate the call (replace this block with real ElevenLabs / Twilio call)
    const callResult = simulateCall();

    // Persist the call record
    const { rows: inserted } = await sql`
      INSERT INTO call_records (patient_id, started_at, duration_seconds, call_status, outcome, summary)
      VALUES (
        ${patientId},
        NOW(),
        ${callResult.durationSeconds},
        ${callResult.status},
        ${callResult.outcome},
        ${callResult.summary}
      )
      RETURNING *
    `;

    // Deactivate old alerts and create a new one based on outcome
    await sql`UPDATE alerts SET is_active = false WHERE patient_id = ${patientId}`;

    let alertLevel = 'green';
    let alertReason = 'Gesprek succesvol afgerond. Situatie stabiel.';

    if (callResult.outcome === 'urgent') {
      alertLevel = 'red';
      alertReason = 'Dringend: probleem gerapporteerd tijdens gesprek.';
    } else if (callResult.outcome === 'needs_review') {
      alertLevel = 'yellow';
      alertReason = 'Opvolging aanbevolen na gesprek.';
    } else if (callResult.outcome === 'no_contact') {
      alertLevel = 'yellow';
      alertReason = 'Geen contact. Nieuwe poging gepland.';
    }

    await sql`
      INSERT INTO alerts (patient_id, level, reason, is_active)
      VALUES (${patientId}, ${alertLevel}, ${alertReason}, true)
    `;

    // Also insert the summary as an AI note
    await sql`
      INSERT INTO notes (patient_id, type, content)
      VALUES (${patientId}, 'ai_summary', ${callResult.summary})
    `;

    return NextResponse.json({
      success: true,
      call: inserted[0],
      alert_level: alertLevel,
    });
  } catch (error) {
    console.error('POST /api/calls error:', error);
    return NextResponse.json({ error: 'Failed to initiate call' }, { status: 500 });
  }
}
