'use client';

import { useMemo } from 'react';
import {
  Stethoscope,
  Pill,
  TestTube,
  ScanSearch,
  Syringe,
  ScrollText,
  ArrowRight,
  Hospital,
} from 'lucide-react';
import { formatDateLongDE } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  consultation: Stethoscope,
  diagnosis: Stethoscope,
  medication: Pill,
  prescription: Pill,
  lab_result: TestTube,
  imaging: ScanSearch,
  vaccination: Syringe,
  referral: ArrowRight,
  hospitalization: Hospital,
};

const COLORS: Record<string, string> = {
  consultation: 'text-medical-500 bg-medical-50',
  diagnosis: 'text-medical-500 bg-medical-50',
  medication: 'text-purple-600 bg-purple-50',
  prescription: 'text-purple-600 bg-purple-50',
  lab_result: 'text-cyan-600 bg-cyan-50',
  imaging: 'text-amber-600 bg-amber-50',
  vaccination: 'text-green-600 bg-green-50',
  referral: 'text-slate-600 bg-slate-50',
  hospitalization: 'text-red-600 bg-red-50',
};

const TYPE_LABELS: Record<string, string> = {
  consultation: 'Konsultation',
  diagnosis: 'Diagnose',
  medication: 'Medikation',
  prescription: 'Verordnung',
  lab_result: 'Labor',
  imaging: 'Bildgebung',
  vaccination: 'Impfung',
  referral: 'Überweisung',
  hospitalization: 'Krankenhaus',
};

interface Event {
  id: string;
  event_date: string;
  event_type: string;
  title: string;
  summary: string | null;
  icd10_codes: string[] | null;
  practitioner?: { name: string; specialty: string | null } | null;
  document?: { file_name: string } | null;
}

export function Timeline({ events }: { events: Event[] }) {
  // Group by month-year
  const grouped = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const event of events) {
      const date = new Date(event.event_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = map.get(key) ?? [];
      existing.push(event);
      map.set(key, existing);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [events]);

  return (
    <div className="space-y-8">
      {grouped.map(([monthKey, monthEvents]) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        const monthLabel = date.toLocaleDateString('de-DE', {
          month: 'long',
          year: 'numeric',
        });

        return (
          <div key={monthKey}>
            <h3 className="text-sm font-semibold text-ink-soft uppercase tracking-wide mb-3">
              {monthLabel}
            </h3>
            <div className="space-y-3">
              {monthEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const Icon = ICONS[event.event_type] ?? Stethoscope;
  const colorClass = COLORS[event.event_type] ?? 'text-medical-500 bg-medical-50';
  const typeLabel = TYPE_LABELS[event.event_type] ?? event.event_type;

  return (
    <Card className="card-hover">
      <div className="p-4 flex gap-3">
        <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="font-semibold text-ink">{event.title}</div>
            <Badge variant="info" className="flex-shrink-0">{typeLabel}</Badge>
          </div>
          <div className="text-xs text-ink-muted mt-0.5">
            {formatDateLongDE(event.event_date)}
            {event.practitioner?.name && (
              <> · {event.practitioner.name}{event.practitioner.specialty ? ` (${event.practitioner.specialty})` : ''}</>
            )}
          </div>
          {event.summary && (
            <p className="text-sm text-ink-soft mt-2 line-clamp-3">{event.summary}</p>
          )}
          {event.icd10_codes && event.icd10_codes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.icd10_codes.map((code) => (
                <Badge key={code} variant="neutral" className="font-mono">{code}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
