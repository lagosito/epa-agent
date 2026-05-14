'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Trash2, AlertTriangle, CreditCard, Shield, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Checkbox } from '@/components/ui/input';
import { formatDateLongDE } from '@/lib/utils';

interface Profile {
  id: string;
  full_name: string | null;
  subscription_tier: string;
  subscription_current_period_end: string | null;
  deletion_status: string;
  deletion_scheduled_at: string | null;
  language: string;
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  pro_monthly: 'Pro (monatlich)',
  pro_yearly: 'Pro (jährlich)',
};

export function ProfileClient({
  profile,
  email,
  currentConsents,
}: {
  profile: Profile;
  email: string;
  currentConsents: Record<string, boolean>;
}) {
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleExport() {
    setBusy(true);
    const link = document.createElement('a');
    link.href = '/api/data/export';
    link.click();
    setTimeout(() => setBusy(false), 1000);
  }

  async function handleDelete() {
    if (deleteConfirm !== 'LÖSCHEN') {
      setMessage({ type: 'error', text: 'Bitte exakt "LÖSCHEN" eingeben.' });
      return;
    }
    setBusy(true);
    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation: deleteConfirm }),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setMessage({ type: 'error', text: data.message ?? data.error });
      return;
    }

    setShowDeleteDialog(false);
    setMessage({
      type: 'success',
      text: `Löschung wurde geplant für ${formatDateLongDE(data.scheduled_at)}. Du hast 14 Tage Zeit, um die Anfrage zurückzuziehen.`,
    });
    router.refresh();
  }

  async function handleCancelDeletion() {
    setBusy(true);
    const res = await fetch('/api/account/cancel-deletion', { method: 'POST' });
    setBusy(false);
    if (res.ok) {
      setMessage({ type: 'success', text: 'Löschung wurde abgebrochen.' });
      router.refresh();
    }
  }

  async function handleManageBilling() {
    setBusy(true);
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setBusy(false);
  }

  async function updateConsent(purpose: string, granted: boolean) {
    const res = await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose, granted }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="container-narrow py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Profil &amp; Einstellungen</h1>
        <p className="text-ink-muted mt-1">{email}</p>
      </div>

      {message && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-danger'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Pending deletion notice */}
      {profile.deletion_status === 'requested' && profile.deletion_scheduled_at && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Löschung wurde beantragt</h3>
                <p className="text-sm text-amber-800 mt-1">
                  Dein Konto und alle Daten werden am{' '}
                  <strong>{formatDateLongDE(profile.deletion_scheduled_at)}</strong> endgültig gelöscht.
                  Du kannst die Anfrage bis dahin zurückziehen.
                </p>
                <Button
                  onClick={handleCancelDeletion}
                  disabled={busy}
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                >
                  <RotateCcw className="h-4 w-4" />
                  Löschung abbrechen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Abonnement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-ink">
                Tarif: {TIER_LABELS[profile.subscription_tier] ?? profile.subscription_tier}
              </div>
              {profile.subscription_current_period_end && (
                <div className="text-sm text-ink-muted">
                  Verlängerung: {formatDateLongDE(profile.subscription_current_period_end)}
                </div>
              )}
            </div>
            <Badge variant={profile.subscription_tier === 'free' ? 'neutral' : 'success'}>
              {profile.subscription_tier === 'free' ? 'Free' : 'Pro'}
            </Badge>
          </div>
          {profile.subscription_tier === 'free' ? (
            <Button onClick={() => router.push('/pricing')}>Upgrade auf Pro</Button>
          ) : (
            <Button variant="secondary" onClick={handleManageBilling} disabled={busy}>
              Abonnement verwalten
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Consent management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Einwilligungen (DSGVO Art. 9)
          </CardTitle>
          <CardDescription>
            Du kannst deine Einwilligungen jederzeit widerrufen. Hinweis: ohne die ersten beiden
            Einwilligungen kann der Dienst nicht weiter genutzt werden.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ConsentRow
            label="Verarbeitung meiner Gesundheitsdaten"
            granted={currentConsents.data_processing ?? false}
            required
            onChange={(g) => updateConsent('data_processing', g)}
          />
          <ConsentRow
            label="Verarbeitung durch Claude (Anthropic, USA)"
            granted={currentConsents.claude_api_processing ?? false}
            required
            onChange={(g) => updateConsent('claude_api_processing', g)}
          />
          <ConsentRow
            label="Anonyme Produktverbesserung"
            granted={currentConsents.product_improvement ?? false}
            onChange={(g) => updateConsent('product_improvement', g)}
          />
          <ConsentRow
            label="Marketing-E-Mails"
            granted={currentConsents.marketing_emails ?? false}
            onChange={(g) => updateConsent('marketing_emails', g)}
          />
        </CardContent>
      </Card>

      {/* Data management */}
      <Card>
        <CardHeader>
          <CardTitle>Datenverwaltung</CardTitle>
          <CardDescription>
            Du hast jederzeit das Recht, deine Daten zu exportieren oder zu löschen (DSGVO Art. 15, 17, 20).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleExport} variant="secondary" disabled={busy}>
            <Download className="h-4 w-4" />
            Alle meine Daten als JSON exportieren
          </Button>

          {profile.deletion_status !== 'requested' && (
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="danger"
              disabled={busy}
            >
              <Trash2 className="h-4 w-4" />
              Konto und alle Daten löschen
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation modal */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-danger">Konto wirklich löschen?</CardTitle>
              <CardDescription>
                Alle deine Dokumente, Diagnosen, Laborwerte und Chats werden in 14 Tagen unwiderruflich gelöscht.
                Du kannst die Anfrage während dieser Zeit zurückziehen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="confirm">
                  Tippe <code className="bg-bg-muted px-1 py-0.5 rounded">LÖSCHEN</code> zur Bestätigung
                </Label>
                <Input
                  id="confirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="LÖSCHEN"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleDelete}
                  variant="danger"
                  disabled={busy || deleteConfirm !== 'LÖSCHEN'}
                  className="flex-1"
                >
                  Endgültig löschen
                </Button>
                <Button
                  onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(''); }}
                  variant="secondary"
                  className="flex-1"
                >
                  Abbrechen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ConsentRow({
  label,
  granted,
  required,
  onChange,
}: {
  label: string;
  granted: boolean;
  required?: boolean;
  onChange: (g: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-ink">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </span>
      <Checkbox
        checked={granted}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
