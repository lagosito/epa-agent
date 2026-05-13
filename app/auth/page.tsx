'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, ArrowLeft, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(errorParam);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?redirect=${redirectTo}`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-subtle">
      <header className="border-b border-border bg-white">
        <div className="container-wide flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 text-ink-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Zurück</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-medical-500 mb-4">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-ink">Anmelden bei ePA Agent</h1>
            <p className="text-sm text-ink-muted mt-2">
              Wir senden dir einen Magic Link per E-Mail — kein Passwort nötig.
            </p>
          </div>

          {sent ? (
            <div className="bg-white border border-border rounded-lg p-6 text-center">
              <Mail className="h-12 w-12 text-medical-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-ink mb-2">E-Mail gesendet</h2>
              <p className="text-sm text-ink-muted">
                Wir haben einen Anmeldelink an <strong>{email}</strong> gesendet.
                Klicke auf den Link, um dich anzumelden.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="mt-4 text-sm text-medical-500 hover:underline"
              >
                Andere E-Mail verwenden
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-border rounded-lg p-6 space-y-4"
            >
              <div>
                <Label htmlFor="email">E-Mail-Adresse</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="du@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {error && (
                <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Sende Magic Link...' : 'Magic Link senden'}
              </Button>

              <p className="text-xs text-ink-muted text-center pt-2">
                Mit der Anmeldung akzeptierst du unsere{' '}
                <Link href="/agb" className="underline">AGB</Link> und{' '}
                <Link href="/datenschutz" className="underline">Datenschutzerklärung</Link>.
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
