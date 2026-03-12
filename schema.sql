-- schema.sql
-- Database schema for the BelOma Patient Calling Dashboard

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  language VARCHAR(50) NOT NULL DEFAULT 'nl',
  birth_year INTEGER NOT NULL,
  risk_level VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adherence_records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  adherence_score INTEGER NOT NULL CHECK (adherence_score >= 0 AND adherence_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER,
  call_status VARCHAR(50) NOT NULL DEFAULT 'initiated' CHECK (call_status IN ('initiated', 'in_progress', 'completed', 'no_answer', 'failed')),
  outcome VARCHAR(50) CHECK (outcome IN ('stable', 'needs_review', 'urgent', 'no_contact', 'completed')),
  summary TEXT,
  transcript TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  level VARCHAR(20) NOT NULL DEFAULT 'green' CHECK (level IN ('green', 'yellow', 'red')),
  reason TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'manual' CHECK (type IN ('ai_summary', 'manual', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adherence_patient_date ON adherence_records(patient_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_calls_patient_started ON call_records(patient_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_patient_active ON alerts(patient_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notes_patient ON notes(patient_id, created_at DESC);
