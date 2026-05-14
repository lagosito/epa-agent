'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Legend,
} from 'recharts';
import { formatDateDE } from '@/lib/utils';

interface LabPoint {
  measured_at: string;
  value: number;
  unit: string;
  parameter_name_de: string;
  reference_low?: number | null;
  reference_high?: number | null;
  flag?: string | null;
}

interface Props {
  data: LabPoint[];
  parameterName: string;
  unit: string;
}

export function LabTrendChart({ data, parameterName, unit }: Props) {
  if (data.length === 0) return null;

  const chartData = data
    .slice()
    .sort((a, b) => a.measured_at.localeCompare(b.measured_at))
    .map((p) => ({
      date: formatDateDE(p.measured_at),
      value: p.value,
      flag: p.flag,
    }));

  const refLow = data.find((d) => d.reference_low != null)?.reference_low;
  const refHigh = data.find((d) => d.reference_high != null)?.reference_high;

  const allValues = data.map((d) => d.value);
  const minVal = Math.min(...allValues, refLow ?? Infinity);
  const maxVal = Math.max(...allValues, refHigh ?? -Infinity);
  const padding = (maxVal - minVal) * 0.15 || 1;

  return (
    <div className="bg-white border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-ink">{parameterName}</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            {data.length} {data.length === 1 ? 'Messung' : 'Messungen'} · Einheit: {unit}
          </p>
        </div>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E6ED" />
            <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis
              domain={[minVal - padding, maxVal + padding]}
              tick={{ fill: '#64748B', fontSize: 11 }}
              label={{ value: unit, angle: -90, position: 'insideLeft', style: { fill: '#64748B', fontSize: 11 } }}
            />

            {/* Reference range band */}
            {refLow != null && refHigh != null && (
              <ReferenceArea
                y1={refLow}
                y2={refHigh}
                fill="#0066CC"
                fillOpacity={0.05}
                stroke="#0066CC"
                strokeOpacity={0.2}
                strokeDasharray="3 3"
              />
            )}

            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E0E6ED',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#0A1628', fontWeight: 600 }}
              formatter={(value: any) => [`${value} ${unit}`, parameterName]}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#0066CC"
              strokeWidth={2}
              dot={{ r: 4, fill: '#0066CC' }}
              activeDot={{ r: 6 }}
              name={parameterName}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {(refLow != null || refHigh != null) && (
        <div className="mt-3 text-xs text-ink-muted">
          Referenzbereich:{' '}
          {refLow != null && refHigh != null
            ? `${refLow} – ${refHigh} ${unit}`
            : refHigh != null
            ? `< ${refHigh} ${unit}`
            : `> ${refLow} ${unit}`}
        </div>
      )}
    </div>
  );
}
