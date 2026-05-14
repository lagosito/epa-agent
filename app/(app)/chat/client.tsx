'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertTriangle, FileText, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: any[];
}

const SUGGESTIONS = [
  'Was war mein letztes Cholesterin?',
  'Welche Medikamente nehme ich aktuell?',
  'Wann war meine letzte Konsultation?',
  'Welche Diagnosen sind dokumentiert?',
];

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(message: string) {
    if (!message.trim() || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? data.error ?? 'Fehler beim Senden.');
        setLoading(false);
        return;
      }

      setConversationId(data.conversation_id);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          citations: data.citations,
        },
      ]);
    } catch (err) {
      setError('Netzwerkfehler.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col">
      {/* Disclaimer banner — always visible */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-start gap-2 text-xs text-amber-900">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div>
          Ich helfe dir, deine eigenen Befunde zu finden und zu verstehen — ich bin <strong>kein Arzt</strong>.
          Ich gebe keine Diagnosen, keine Medikamentenempfehlungen und keine medizinischen Bewertungen.
          Bei gesundheitlichen Fragen wende dich bitte an deinen Arzt oder die 116 117 (ärztlicher Bereitschaftsdienst).
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-medical-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-ink mb-2">
                Stelle Fragen zu deiner Krankengeschichte
              </h2>
              <p className="text-sm text-ink-muted mb-6">
                Ich antworte basierend auf deinen hochgeladenen Dokumenten.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-white text-ink-soft hover:bg-medical-50 hover:border-medical-200 hover:text-medical-700 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-medical-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                ePA
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-muted bg-white rounded-lg px-4 py-3 border border-border">
                <Loader2 className="h-4 w-4 animate-spin" />
                Suche in deinen Dokumenten...
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border bg-white p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Frage zu deiner Krankengeschichte stellen..."
            disabled={loading}
            className="flex-1 input"
            autoFocus
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-medical-500 text-white rounded-lg px-4 py-2.5 max-w-[80%]">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-full bg-medical-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
        ePA
      </div>
      <div className="bg-white rounded-lg px-4 py-3 border border-border max-w-[80%]">
        <div className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border space-y-1.5">
            <div className="text-xs font-medium text-ink-muted">Quellen:</div>
            {message.citations.slice(0, 3).map((c, i) => (
              <a
                key={i}
                href={c.document_id ? `/api/documents/${c.document_id}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-medical-600 hover:underline"
              >
                <FileText className="h-3 w-3" />
                {c.document_file_name ?? 'Dokument'}
                {c.measured_at && ` (${new Date(c.measured_at).toLocaleDateString('de-DE')})`}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
