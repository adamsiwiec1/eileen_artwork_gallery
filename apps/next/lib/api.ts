import type { Catalog, CheckoutResult, Quote, ShippingRate, StudioState } from './types';
import type { GalleryPiece, Testimonial } from './content';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { error?: string };
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
  quote: (body: {
    mediumId: string;
    sizeId: string;
    rushTierId: string;
    framed: boolean;
    shippingCents?: number;
    shippingLabel?: string;
  }) => post<Quote>('/quote', body),
  rates: (address: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  }) => post<{ shipmentId: string; rates: ShippingRate[] }>('/shipping/rates', { address }),
  checkout: (body: unknown) => post<CheckoutResult>('/checkout', body),
};
