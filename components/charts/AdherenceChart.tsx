'use client';
// components/charts/AdherenceChart.tsx
// Line chart showing adherence scores over time using Recharts

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { AdherenceRecord } from '@/lib/types';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface AdherenceChartProps {
  records: AdherenceRecord[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const score = payload[0].value;
  const color = score >= 90 ? '#16a34a' : score >= 70 ? '#ca8a04' : '#dc2626';
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-bold" style={{ color }}>
        {score}%
      </p>
    </div>
  );
}

export default function AdherenceChart({ records }: AdherenceChartProps) {
  const data = records.map((r) => ({
    date: format(new Date(r.date), 'd MMM', { locale: nl }),
    score: r.adherence_score,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        {/* Reference lines for thresholds */}
        <ReferenceLine y={90} stroke="#16a34a" strokeDasharray="4 4" strokeOpacity={0.5} />
        <ReferenceLine y={70} stroke="#dc2626" strokeDasharray="4 4" strokeOpacity={0.5} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#0ea5e9"
          strokeWidth={2.5}
          dot={{ fill: '#0ea5e9', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#0284c7' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
