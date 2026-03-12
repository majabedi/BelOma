'use client';
// app/patients/[id]/page.tsx
// Patient detail page: profile, call history, adherence chart, notes, alerts, and Start Call

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  User,
  MessageSquare,
  PhoneCall,
  PhoneOff,
  Loader2,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import AdherenceChart from '@/components/charts/AdherenceChart';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate, formatDuration, getAge } from '@/lib/utils';
import { PatientDetail, CallRecord, Note } from '@/lib/types';

const LANG_LABELS: Record<string, string> = { nl: 'Nederlands', ar: 'Arabisch', tr: 'Turks', en: 'Engels' };
const RISK_LABELS: Record<string, string> = { low: 'Laag', medium: 'Gemiddeld', high: 'Hoog' };

function alertVariant(level: string) {
  if (level === 'red') return 'red';
  if (level === 'yellow') return 'yellow';
  return 'green';
}

function outcomeIcon(outcome: string | null) {
  if (outcome === 'stable') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (outcome === 'urgent') return <AlertTriangle className="w-4 h-4 text-red-500" />;
  if (outcome === 'needs_review') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  if (outcome === 'no_contact') return <PhoneOff className="w-4 h-4 text-slate-400" />;
  return <Phone className="w-4 h-4 text-slate-400" />;
}

const OUTCOME_LABELS: Record<string, string> = {
  stable: 'Stabiel',
  needs_review: 'Opvolging nodig',
  urgent: 'Dringend',
  no_contact: 'Geen contact',
  completed: 'Afgerond',
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  ai_summary: 'AI Samenvatting',
  manual: 'Handmatig',
  system: 'Systeem',
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [callLoading, setCallLoading] = useState(false);
  const [callResult, setCallResult] = useState<{ outcome: string; summary: string } | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const fetchPatient = async () => {
    const res = await fetch(`/api/patients/${id}`);
    const data = await res.json();
    setPatient(data.patient ?? null);
    setLoading(false);
  };

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const handleStartCall = async () => {
    setCallLoading(true);
    setCallResult(null);
    setCallError(null);
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fout bij starten gesprek');
      setCallResult({ outcome: data.call.outcome, summary: data.call.summary });
      // Refresh patient data to show the new call record
      await fetchPatient();
    } catch (e) {
      setCallError(e instanceof Error ? e.message : 'Onbekende fout');
    } finally {
      setCallLoading(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!patient) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Patiënt niet gevonden.</p>
        <Link href="/patients" className="text-brand-600 text-sm mt-2 inline-block">← Terug naar overzicht</Link>
      </div>
    );
  }

  const alertBadge = patient.active_alert ? (
    <Badge variant={alertVariant(patient.active_alert.level) as 'red' | 'yellow' | 'green'} dot>
      {patient.active_alert.level === 'red' ? 'Urgent' : patient.active_alert.level === 'yellow' ? 'Opvolging' : 'Stabiel'}
    </Badge>
  ) : null;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Back link */}
      <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug naar patiënten
      </Link>

      {/* Top: Patient info card */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-brand-700">{patient.full_name.charAt(0)}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
              {alertBadge}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {getAge(patient.birth_year)} jaar
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {patient.phone}
              </span>
              <span>{LANG_LABELS[patient.language] ?? patient.language}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={patient.risk_level === 'high' ? 'red' : patient.risk_level === 'medium' ? 'yellow' : 'green'} dot>
                {RISK_LABELS[patient.risk_level]} risico
              </Badge>
              {patient.latest_adherence !== null && (
                <Badge variant={patient.latest_adherence >= 90 ? 'green' : patient.latest_adherence >= 70 ? 'yellow' : 'red'}>
                  Adherentie: {patient.latest_adherence}%
                </Badge>
              )}
            </div>

            {/* Alert reason */}
            {patient.active_alert && (
              <div className="mt-3 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                <span className="font-medium text-slate-700">Actief alert:</span> {patient.active_alert.reason}
              </div>
            )}
          </div>

          {/* Start Call button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleStartCall}
              disabled={callLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              {callLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Gesprek starten...</>
              ) : (
                <><PhoneCall className="w-4 h-4" /> Gesprek starten</>
              )}
            </button>
          </div>
        </div>

        {/* Call result banner */}
        {callResult && (
          <div className={`mt-4 p-3 rounded-lg text-sm border ${
            callResult.outcome === 'urgent' ? 'bg-red-50 border-red-200 text-red-700'
            : callResult.outcome === 'needs_review' ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
            : callResult.outcome === 'no_contact' ? 'bg-slate-100 border-slate-200 text-slate-600'
            : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            <p className="font-semibold mb-1">
              Gesprek afgerond — {OUTCOME_LABELS[callResult.outcome] ?? callResult.outcome}
            </p>
            <p className="text-xs">{callResult.summary}</p>
          </div>
        )}
        {callError && (
          <div className="mt-4 p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
            Fout: {callError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Adherence chart + Call history */}
        <div className="lg:col-span-2 space-y-6">
          {/* Adherence Chart */}
          {patient.adherence_records.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-800">Adherentie over tijd</h2>
              </div>
              <div className="text-xs text-slate-400 mb-3 flex gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 border-t-2 border-dashed border-green-500 inline-block" />
                  90% drempel
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 border-t-2 border-dashed border-red-500 inline-block" />
                  70% drempel
                </span>
              </div>
              <AdherenceChart records={patient.adherence_records} />
            </div>
          )}

          {/* Call History */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Phone className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Gespreksgeschiedenis</h2>
              <span className="ml-auto text-xs text-slate-400">{patient.call_records.length} gesprekken</span>
            </div>
            {patient.call_records.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">
                Nog geen gesprekken
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {patient.call_records.map((call: CallRecord) => (
                  <div key={call.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{outcomeIcon(call.outcome)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-800">
                            {OUTCOME_LABELS[call.outcome ?? ''] ?? call.outcome ?? 'Gesprek'}
                          </span>
                          {call.duration_seconds && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />
                              {formatDuration(call.duration_seconds)}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 ml-auto">{formatDate(call.started_at)}</span>
                        </div>
                        {call.summary && (
                          <p className="text-xs text-slate-500 leading-relaxed">{call.summary}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Alert timeline + Notes */}
        <div className="space-y-5">
          {/* Alert timeline */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <AlertTriangle className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Alertgeschiedenis</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {patient.alerts.length === 0 ? (
                <p className="px-5 py-6 text-xs text-slate-400 text-center">Geen alerts</p>
              ) : patient.alerts.map((alert) => (
                <div key={alert.id} className="px-5 py-3.5">
                  <div className="flex items-start gap-2">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      alert.level === 'red' ? 'bg-red-500'
                      : alert.level === 'yellow' ? 'bg-yellow-500'
                      : 'bg-green-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 leading-relaxed">{alert.reason}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-slate-400">{formatDate(alert.created_at)}</span>
                        {!alert.is_active && (
                          <span className="text-[10px] text-slate-400">Opgelost</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes / AI Summaries */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Notities & Samenvattingen</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {patient.notes.length === 0 ? (
                <p className="px-5 py-6 text-xs text-slate-400 text-center">Geen notities</p>
              ) : patient.notes.map((note: Note) => (
                <div key={note.id} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    {note.type === 'ai_summary' ? (
                      <Badge variant="blue" size="sm">AI Samenvatting</Badge>
                    ) : (
                      <Badge variant="slate" size="sm">{NOTE_TYPE_LABELS[note.type]}</Badge>
                    )}
                    <span className="text-[10px] text-slate-400 ml-auto">{formatDate(note.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
