'use client';
// app/patients/page.tsx
// Patient list page with search and filter

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Filter, Phone, ChevronRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { SkeletonRow } from '@/components/ui/LoadingSpinner';
import { formatDate, getAge } from '@/lib/utils';

type PatientRow = {
  id: number;
  full_name: string;
  phone: string;
  language: string;
  birth_year: number;
  risk_level: string;
  latest_adherence: number | null;
  alert_level: string | null;
  last_call_at: string | null;
};

const LANGUAGES = ['Alle', 'nl', 'ar', 'tr', 'en'];
const RISK_LEVELS = ['Alle', 'low', 'medium', 'high'];
const ALERT_LEVELS = ['Alle', 'green', 'yellow', 'red'];

const LANG_LABELS: Record<string, string> = { nl: 'Nederlands', ar: 'Arabisch', tr: 'Turks', en: 'Engels' };
const RISK_LABELS: Record<string, string> = { low: 'Laag', medium: 'Gemiddeld', high: 'Hoog' };
const ALERT_LABELS: Record<string, string> = { green: 'Stabiel', yellow: 'Opvolging', red: 'Urgent' };

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('Alle');
  const [riskFilter, setRiskFilter] = useState('Alle');
  const [alertFilter, setAlertFilter] = useState('Alle');

  useEffect(() => {
    fetch('/api/patients')
      .then((r) => r.json())
      .then((d) => { setPatients(d.patients ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) => {
    const matchSearch =
      search === '' ||
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);
    const matchLang = langFilter === 'Alle' || p.language === langFilter;
    const matchRisk = riskFilter === 'Alle' || p.risk_level === riskFilter;
    const matchAlert = alertFilter === 'Alle' || p.alert_level === alertFilter;
    return matchSearch && matchLang && matchRisk && matchAlert;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Patiënten</h1>
        <p className="text-sm text-slate-500 mt-1">{patients.length} patiënten in het systeem</p>
      </div>

      {/* Search & Filters */}
      <div className="card p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Zoek op naam of telefoonnummer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {/* Language filter */}
          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l === 'Alle' ? 'Alle talen' : LANG_LABELS[l]}</option>
            ))}
          </select>
          {/* Risk filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {RISK_LEVELS.map((l) => (
              <option key={l} value={l}>{l === 'Alle' ? 'Alle risico\'s' : RISK_LABELS[l]}</option>
            ))}
          </select>
          {/* Alert filter */}
          <select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            {ALERT_LEVELS.map((l) => (
              <option key={l} value={l}>{l === 'Alle' ? 'Alle statussen' : ALERT_LABELS[l]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Naam</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Telefoon</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Taal</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Risico</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Adherentie</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Laatste gesprek</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-400">
                  Geen patiënten gevonden
                </td>
              </tr>
            )}
            {!loading && filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-brand-700">{p.full_name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{p.full_name}</p>
                      <p className="text-xs text-slate-400">{getAge(p.birth_year)} jaar</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{p.phone}</td>
                <td className="px-4 py-3.5">
                  <Badge variant="slate">{LANG_LABELS[p.language] ?? p.language}</Badge>
                </td>
                <td className="px-4 py-3.5">
                  <Badge
                    variant={p.risk_level === 'high' ? 'red' : p.risk_level === 'medium' ? 'yellow' : 'green'}
                    dot
                  >
                    {RISK_LABELS[p.risk_level]}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
                  {p.latest_adherence !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${p.latest_adherence}%`,
                            background: p.latest_adherence >= 90 ? '#16a34a'
                              : p.latest_adherence >= 70 ? '#ca8a04' : '#dc2626',
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{p.latest_adherence}%</span>
                    </div>
                  ) : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3.5">
                  {p.alert_level ? (
                    <Badge
                      variant={p.alert_level === 'red' ? 'red' : p.alert_level === 'yellow' ? 'yellow' : 'green'}
                      dot
                    >
                      {ALERT_LABELS[p.alert_level]}
                    </Badge>
                  ) : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-400">
                  {p.last_call_at ? formatDate(p.last_call_at) : '—'}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    href={`/patients/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
