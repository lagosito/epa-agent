'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Trash2, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatBytes, formatRelativeDE } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Document {
  id: string;
  file_name: string;
  file_size_bytes: number;
  document_type: string;
  parsing_status: string;
  parsing_error: string | null;
  uploaded_at: string;
  confidence: number | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  pending: { label: 'Wartend', variant: 'neutral' },
  processing: { label: 'Verarbeitung läuft', variant: 'info' },
  completed: { label: 'Verarbeitet', variant: 'success' },
  requires_review: { label: 'Prüfung nötig', variant: 'warning' },
  failed: { label: 'Fehlgeschlagen', variant: 'danger' },
};

const DOCUMENT_TYPES: Record<string, string> = {
  arztbrief: 'Arztbrief',
  laborwerte: 'Laborwerte',
  rezept: 'Rezept',
  ueberweisung: 'Überweisung',
  befund_bildgebung: 'Bildgebung',
  impfpass: 'Impfpass',
  unknown: 'Unbekannt',
};

export function DocumentsClient({
  initialDocuments,
  tier,
}: {
  initialDocuments: Document[];
  tier: string;
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Realtime subscription for status updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setDocuments((prev) =>
              prev.map((d) => (d.id === (payload.new as any).id ? (payload.new as Document) : d))
            );
          } else if (payload.eventType === 'INSERT') {
            setDocuments((prev) => [payload.new as Document, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setDocuments((prev) => prev.filter((d) => d.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    for (const file of acceptedFiles) formData.append('files', file);

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setError(errBody.message ?? errBody.error ?? 'Upload fehlgeschlagen.');
      } else {
        router.refresh();
      }
    } catch (err) {
      setError('Netzwerkfehler beim Upload.');
    } finally {
      setUploading(false);
    }
  }, [router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 20 * 1024 * 1024,
    disabled: uploading,
  });

  async function handleDelete(id: string, fileName: string) {
    if (!confirm(`"${fileName}" wirklich löschen? Alle daraus extrahierten Daten werden ebenfalls entfernt.`)) {
      return;
    }
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } else {
      alert('Löschen fehlgeschlagen.');
    }
  }

  const docCount = documents.length;
  const limitReached = tier === 'free' && docCount >= 5;

  return (
    <div className="container-wide py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Meine Dokumente</h1>
        <p className="text-ink-muted mt-1">
          {docCount} {docCount === 1 ? 'Dokument' : 'Dokumente'}
          {tier === 'free' && ` von 5 (Free-Tier)`}
        </p>
      </div>

      {!limitReached && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-medical-500 bg-medical-50'
              : 'border-border hover:border-medical-300 bg-white'
          } ${uploading ? 'opacity-50 cursor-wait' : ''}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="h-10 w-10 text-medical-500 mx-auto mb-3 animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-medical-500 mx-auto mb-3" />
          )}
          <h3 className="font-semibold text-ink mb-1">
            {isDragActive ? 'Loslassen zum Hochladen' : 'PDFs hierher ziehen oder klicken'}
          </h3>
          <p className="text-sm text-ink-muted">
            Bis zu 20 MB pro Datei. Mehrere Dateien gleichzeitig möglich.
          </p>
        </div>
      )}

      {limitReached && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="p-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Free-Tier-Limit erreicht</h3>
              <p className="text-sm text-amber-800 mt-1">
                Du hast 5 von 5 Dokumenten im kostenlosen Tarif genutzt. Upgrade auf Pro für unbegrenzte Dokumente.
              </p>
              <Button
                onClick={() => router.push('/pricing')}
                size="sm"
                className="mt-3"
              >
                Upgrade auf Pro
              </Button>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <div className="mt-4 text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Document list */}
      <div className="mt-8 space-y-3">
        {documents.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-ink-faint mx-auto mb-3" />
              <p className="text-ink-muted">Noch keine Dokumente hochgeladen.</p>
            </div>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id}>
              <div className="p-4 flex items-center gap-4">
                <FileText className="h-8 w-8 text-medical-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink truncate">{doc.file_name}</div>
                  <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{formatBytes(doc.file_size_bytes)}</span>
                    <span>·</span>
                    <span>{formatRelativeDE(doc.uploaded_at)}</span>
                    {doc.document_type && doc.document_type !== 'unknown' && (
                      <>
                        <span>·</span>
                        <span>{DOCUMENT_TYPES[doc.document_type]}</span>
                      </>
                    )}
                    {doc.confidence != null && (
                      <>
                        <span>·</span>
                        <span>Confidence: {Math.round(doc.confidence * 100)}%</span>
                      </>
                    )}
                  </div>
                  {doc.parsing_error && (
                    <div className="text-xs text-danger mt-1 truncate">
                      Fehler: {doc.parsing_error}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={STATUS_CONFIG[doc.parsing_status]?.variant ?? 'neutral'}>
                    {doc.parsing_status === 'processing' && (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin inline" />
                    )}
                    {doc.parsing_status === 'completed' && (
                      <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                    )}
                    {STATUS_CONFIG[doc.parsing_status]?.label ?? doc.parsing_status}
                  </Badge>
                  <button
                    onClick={() => handleDelete(doc.id, doc.file_name)}
                    className="text-ink-muted hover:text-danger p-1"
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
