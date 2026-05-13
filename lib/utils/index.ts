import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistance, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Compute SHA-256 hash of a Buffer or ArrayBuffer.
 * Used for document deduplication.
 */
export async function sha256(data: ArrayBuffer | Buffer): Promise<string> {
  const buffer = data instanceof Buffer ? data : Buffer.from(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * German date formatting for UI.
 */
export function formatDateDE(date: string | Date, opts?: { withTime?: boolean }): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (opts?.withTime) {
    return format(d, "dd.MM.yyyy 'um' HH:mm", { locale: de });
  }
  return format(d, 'dd.MM.yyyy', { locale: de });
}

export function formatDateLongDE(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "d. MMMM yyyy", { locale: de });
}

export function formatRelativeDE(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(d, new Date(), { locale: de, addSuffix: true });
}

/**
 * Format file size for display.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get client IP from request headers (Vercel / Cloudflare aware).
 */
export function getClientIp(headers: Headers): string | null {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    null
  );
}
