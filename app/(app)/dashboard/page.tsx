import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, MessageCircle, Upload, TrendingUp } from 'lucide-react';
import { Timeline } from '@/components/timeline/timeline';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch counts
  const [docCount, eventCount, profile] = await Promise.all([
    supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
    supabase
      .from('medical_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
    supabase
      .from('profiles')
      .select('full_name, subscription_tier')
      .eq('id', user!.id)
      .single(),
  ]);

  // Recent events for timeline preview
  const { data: events } = await supabase
    .from('medical_events')
    .select(`
      *,
      practitioner:practitioners(name, specialty),
      document:documents(file_name)
    `)
    .eq('user_id', user!.id)
    .order('event_date', { ascending: false })
    .limit(20);

  return (
    <div className="container-wide py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            Hallo{profile.data?.full_name ? `, ${profile.data.full_name}` : ''}
          </h1>
          <p className="text-ink-muted mt-1">Hier ist deine medizinische Übersicht.</p>
        </div>
        <Link href="/documents">
          <button className="btn-primary">
            <Upload className="h-4 w-4" />
            Dokument hochladen
          </button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Dokumente"
          value={docCount.count ?? 0}
          href="/documents"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Ereignisse im Verlauf"
          value={eventCount.count ?? 0}
          href="/dashboard"
        />
        <StatCard
          icon={<MessageCircle className="h-5 w-5" />}
          label="Frage stellen"
          value={null}
          subtitle="Assistent"
          href="/chat"
        />
      </div>

      {/* Timeline */}
      <div>
        <h2 className="text-lg font-semibold text-ink mb-4">Verlauf</h2>
        {events && events.length > 0 ? (
          <Timeline events={events} />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-ink-faint mx-auto mb-3" />
              <h3 className="font-semibold text-ink mb-1">Noch keine Dokumente</h3>
              <p className="text-sm text-ink-muted mb-4">
                Lade dein erstes medizinisches Dokument hoch, um deinen Verlauf zu starten.
              </p>
              <Link href="/documents">
                <button className="btn-primary">
                  <Upload className="h-4 w-4" />
                  Erstes Dokument hochladen
                </button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  subtitle?: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="card-hover cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-ink-muted">{label}</div>
              <div className="text-2xl font-bold text-ink mt-1">
                {value !== null ? value : subtitle}
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-medical-50 flex items-center justify-center text-medical-500">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
