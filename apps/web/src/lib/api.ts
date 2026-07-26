import type {
  Catalog,
  CheckoutResult,
  GalleryPiece,
  Quote,
  StudioState,
  Testimonial,
} from './types';

/**
 * Empty by default, which keeps every request relative and same-origin. That is
 * what lets Vite's dev proxy (and therefore ngrok) work with no CORS layer.
 *
 * In production the API lives on a different host, so `VITE_API_URL` is baked in
 * at build time and requests become absolute. Set it with no trailing slash.
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(detail.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const api = {
  catalog: () => request<Catalog>('/catalog'),
  testimonials: () => request<{ testimonials: Testimonial[] }>('/testimonials'),
  gallery: () => request<{ pieces: GalleryPiece[] }>('/gallery'),

  generate: (prompt: string) => post<StudioState>('/studio/generate', { prompt }),
  refine: (sessionId: string, instruction: string) =>
    post<StudioState>('/studio/refine', { sessionId, instruction }),

  quote: (body: { mediumId: string; sizeId: string; rushTierId: string; framed: boolean }) =>
    post<Quote>('/quote', body),

  checkout: (body: {
    sessionId: string;
    mediumId: string;
    sizeId: string;
    rushTierId: string;
    framed: boolean;
    name: string;
    email: string;
  }) => post<CheckoutResult>('/checkout', body),
};

export const money = (cents: number) =>
  (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
