import type {
  Catalog,
  CheckoutResult,
  GalleryPiece,
  Quote,
  StudioState,
  Testimonial,
} from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
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
