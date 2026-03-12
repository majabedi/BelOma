// app/api/seed/route.ts
// Database initialization and seeding endpoint
// Call POST /api/seed to create tables and insert demo data
// IMPORTANT: Remove or protect this endpoint in production

import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // ── 1. Create tables ──────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        language VARCHAR(50) NOT NULL DEFAULT 'nl',
        birth_year INTEGER NOT NULL,
        risk_level VARCHAR(20) NOT NULL DEFAULT 'low'
          CHECK (risk_level IN ('low', 'medium', 'high')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS adherence_records (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        adherence_score INTEGER NOT NULL
          CHECK (adherence_score >= 0 AND adherence_score <= 100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS call_records (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        duration_seconds INTEGER,
        call_status VARCHAR(50) NOT NULL DEFAULT 'initiated'
          CHECK (call_status IN ('initiated', 'in_progress', 'completed', 'no_answer', 'failed')),
        outcome VARCHAR(50)
          CHECK (outcome IN ('stable', 'needs_review', 'urgent', 'no_contact', 'completed')),
        summary TEXT,
        transcript TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        level VARCHAR(20) NOT NULL DEFAULT 'green'
          CHECK (level IN ('green', 'yellow', 'red')),
        reason TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL DEFAULT 'manual'
          CHECK (type IN ('ai_summary', 'manual', 'system')),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // ── 2. Clear existing demo data ───────────────────────────────────────────
    await sql`DELETE FROM notes`;
    await sql`DELETE FROM alerts`;
    await sql`DELETE FROM call_records`;
    await sql`DELETE FROM adherence_records`;
    await sql`DELETE FROM patients`;

    // ── 3. Insert demo patients ───────────────────────────────────────────────
    const p1 = await sql`
      INSERT INTO patients (full_name, phone, language, birth_year, risk_level)
      VALUES ('Maria van den Berg', '+31 6 12345678', 'nl', 1948, 'high')
      RETURNING id
    `;
    const p2 = await sql`
      INSERT INTO patients (full_name, phone, language, birth_year, risk_level)
      VALUES ('Jan de Vries', '+31 6 23456789', 'nl', 1955, 'medium')
      RETURNING id
    `;
    const p3 = await sql`
      INSERT INTO patients (full_name, phone, language, birth_year, risk_level)
      VALUES ('Fatima El Amrani', '+31 6 34567890', 'ar', 1962, 'high')
      RETURNING id
    `;
    const p4 = await sql`
      INSERT INTO patients (full_name, phone, language, birth_year, risk_level)
      VALUES ('Pieter Bakker', '+31 6 45678901', 'nl', 1970, 'low')
      RETURNING id
    `;
    const p5 = await sql`
      INSERT INTO patients (full_name, phone, language, birth_year, risk_level)
      VALUES ('Layla Yilmaz', '+31 6 56789012', 'tr', 1958, 'medium')
      RETURNING id
    `;

    const ids = [p1.rows[0].id, p2.rows[0].id, p3.rows[0].id, p4.rows[0].id, p5.rows[0].id];

    // ── 4. Adherence records (last 8 weeks) ───────────────────────────────────
    const adherenceData: Array<{ pid: number; scores: number[] }> = [
      { pid: ids[0], scores: [88, 75, 65, 60, 72, 58, 55, 50] }, // Maria – urgent
      { pid: ids[1], scores: [92, 88, 85, 90, 87, 84, 89, 91] }, // Jan – stable
      { pid: ids[2], scores: [70, 68, 60, 55, 62, 58, 62, 65] }, // Fatima – critical
      { pid: ids[3], scores: [96, 98, 95, 97, 99, 96, 98, 97] }, // Pieter – excellent
      { pid: ids[4], scores: [82, 79, 85, 88, 83, 76, 80, 78] }, // Layla – moderate
    ];

    for (const { pid, scores } of adherenceData) {
      for (let i = 0; i < scores.length; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (7 - i) * 7);
        const dateStr = d.toISOString().split('T')[0];
        await sql`
          INSERT INTO adherence_records (patient_id, date, adherence_score)
          VALUES (${pid}, ${dateStr}, ${scores[i]})
        `;
      }
    }

    // ── 5. Call records ───────────────────────────────────────────────────────
    const callsData = [
      {
        pid: ids[0],
        calls: [
          { daysAgo: 2, duration: 245, status: 'completed', outcome: 'urgent', summary: 'Patiënte geeft aan medicatie regelmatig te vergeten. Klaagt over bijwerkingen. Doorverwezen naar verpleegkundige voor nader overleg.' },
          { daysAgo: 9, duration: 310, status: 'completed', outcome: 'needs_review', summary: 'Adherentie gedaald. Patiënte voelt zich moe. Afgesproken om medicijndoos te bestellen.' },
          { daysAgo: 16, duration: 0, status: 'no_answer', outcome: 'no_contact', summary: 'Geen gehoor. Bericht achtergelaten.' },
        ],
      },
      {
        pid: ids[1],
        calls: [
          { daysAgo: 3, duration: 180, status: 'completed', outcome: 'stable', summary: 'Goed gesprek. Jan neemt medicatie trouw in. Geen klachten. Volgende controle over 4 weken.' },
          { daysAgo: 31, duration: 205, status: 'completed', outcome: 'stable', summary: 'Alles verloopt goed. Patiënt is tevreden met het huidige schema.' },
        ],
      },
      {
        pid: ids[2],
        calls: [
          { daysAgo: 1, duration: 290, status: 'completed', outcome: 'urgent', summary: 'Fatima vergeet medicatie regelmatig vanwege werk. Taalbarrière speelt een rol. Arabischtalige ondersteuning aanbevolen.' },
          { daysAgo: 8, duration: 0, status: 'no_answer', outcome: 'no_contact', summary: 'Geen contact. Tweede poging gepland.' },
          { daysAgo: 10, duration: 0, status: 'no_answer', outcome: 'no_contact', summary: 'Geen gehoor. Niet bereikbaar.' },
        ],
      },
      {
        pid: ids[3],
        calls: [
          { daysAgo: 5, duration: 150, status: 'completed', outcome: 'stable', summary: 'Uitstekende adherentie. Pieter is zeer gemotiveerd en stelt vragen over leefstijl. Positief gesprek.' },
        ],
      },
      {
        pid: ids[4],
        calls: [
          { daysAgo: 4, duration: 220, status: 'completed', outcome: 'needs_review', summary: 'Layla heeft moeite met bijhouden van de tijden door wisselende werkuren. Plan aangepast naar ochtendinnname.' },
          { daysAgo: 18, duration: 195, status: 'completed', outcome: 'stable', summary: 'Goede voortgang. Schema aangepast en patiënte begrijpt het belang van regelmaat.' },
        ],
      },
    ];

    for (const { pid, calls } of callsData) {
      for (const c of calls) {
        const startedAt = new Date();
        startedAt.setDate(startedAt.getDate() - c.daysAgo);
        await sql`
          INSERT INTO call_records (patient_id, started_at, duration_seconds, call_status, outcome, summary)
          VALUES (${pid}, ${startedAt.toISOString()}, ${c.duration || null}, ${c.status}, ${c.outcome}, ${c.summary})
        `;
      }
    }

    // ── 6. Alerts ─────────────────────────────────────────────────────────────
    await sql`INSERT INTO alerts (patient_id, level, reason, is_active) VALUES (${ids[0]}, 'red', 'Adherentie onder 60% — dringend contact vereist', true)`;
    await sql`INSERT INTO alerts (patient_id, level, reason, is_active) VALUES (${ids[2]}, 'red', 'Meerdere keren niet bereikbaar — hoge risicostatus', true)`;
    await sql`INSERT INTO alerts (patient_id, level, reason, is_active) VALUES (${ids[4]}, 'yellow', 'Adherentie daalt — opvolging aanbevolen', true)`;
    await sql`INSERT INTO alerts (patient_id, level, reason, is_active) VALUES (${ids[1]}, 'green', 'Stabiele adherentie', true)`;
    await sql`INSERT INTO alerts (patient_id, level, reason, is_active) VALUES (${ids[3]}, 'green', 'Excellente adherentie — geen actie vereist', true)`;

    // ── 7. Notes / AI summaries ───────────────────────────────────────────────
    await sql`INSERT INTO notes (patient_id, type, content) VALUES (${ids[0]}, 'ai_summary', 'Patiënte Maria van den Berg toont een zorgwekkende daling in adherentie over de afgelopen 8 weken. Er zijn bijwerkingen gerapporteerd die mogelijk de oorzaak zijn van het niet innemen van medicatie. Aanbeveling: intensieve begeleiding en aanpassing van het medicatieschema in overleg met behandelend arts.')`;
    await sql`INSERT INTO notes (patient_id, type, content) VALUES (${ids[0]}, 'manual', 'Telefonisch contact gehad met mantelzorger (dochter). Zij zal dagelijks herinnering instellen op telefoon van patiënte.')`;
    await sql`INSERT INTO notes (patient_id, type, content) VALUES (${ids[2]}, 'ai_summary', 'Fatima El Amrani is meerdere malen niet bereikbaar geweest. De taalbarrière vormt een aanzienlijk risico voor de medicatietrouw. Aanbeveling: inzet van tolkdienst of Arabischtalige verpleegkundige.')`;
    await sql`INSERT INTO notes (patient_id, type, content) VALUES (${ids[4]}, 'ai_summary', 'Layla Yilmaz vertoont een wisselend adherentiepatroon gerelateerd aan haar werk-uren. Het aangepaste ochtendinnameschema lijkt veelbelovend. Monitoring aanbevolen in de komende 2 weken.')`;
    await sql`INSERT INTO notes (patient_id, type, content) VALUES (${ids[3]}, 'manual', 'Pieter is een voorbeeldpatiënt. Actief en gemotiveerd. Geen interventie nodig.')`;

    return NextResponse.json({ success: true, message: 'Database initialized and seeded with 5 demo patients.' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
