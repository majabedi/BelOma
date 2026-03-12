// lib/types.ts
// All TypeScript types matching the database schema

export type RiskLevel = 'low' | 'medium' | 'high';
export type AlertLevel = 'green' | 'yellow' | 'red';
export type CallStatus = 'initiated' | 'in_progress' | 'completed' | 'no_answer' | 'failed';
export type CallOutcome = 'stable' | 'needs_review' | 'urgent' | 'no_contact' | 'completed';
export type NoteType = 'ai_summary' | 'manual' | 'system';

export interface Patient {
  id: number;
  full_name: string;
  phone: string;
  language: string;
  birth_year: number;
  risk_level: RiskLevel;
  created_at: string;
  updated_at: string;
}

export interface AdherenceRecord {
  id: number;
  patient_id: number;
  date: string;
  adherence_score: number; // 0-100
  created_at: string;
}

export interface CallRecord {
  id: number;
  patient_id: number;
  started_at: string;
  duration_seconds: number | null;
  call_status: CallStatus;
  outcome: CallOutcome | null;
  summary: string | null;
  transcript: string | null;
  created_at: string;
}

export interface Alert {
  id: number;
  patient_id: number;
  level: AlertLevel;
  reason: string;
  is_active: boolean;
  created_at: string;
}

export interface Note {
  id: number;
  patient_id: number;
  type: NoteType;
  content: string;
  created_at: string;
}

// Enriched types for the UI
export interface PatientWithStatus extends Patient {
  latest_adherence: number | null;
  active_alert: Alert | null;
  last_call: CallRecord | null;
}

export interface PatientDetail extends Patient {
  adherence_records: AdherenceRecord[];
  call_records: CallRecord[];
  alerts: Alert[];
  notes: Note[];
  active_alert: Alert | null;
  latest_adherence: number | null;
}

export interface DashboardStats {
  total_patients: number;
  calls_today: number;
  patients_with_alerts: number;
  avg_adherence: number;
}
