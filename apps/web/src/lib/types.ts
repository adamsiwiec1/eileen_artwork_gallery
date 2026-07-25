export type Medium = {
  id: string;
  name: string;
  blurb: string;
  priceMultiplier: number;
  extraDays: number;
  texture: string;
};

export type Size = {
  id: string;
  name: string;
  inches: string;
  basePriceCents: number;
  aspect: number;
};

export type RushTier = {
  id: string;
  name: string;
  leadTime: string;
  minDays: number;
  maxDays: number;
  surchargePct: number;
  flatFeeCents: number;
  description: string;
};

export type Catalog = { mediums: Medium[]; sizes: Size[]; rushTiers: RushTier[] };

export type QuoteLine = { label: string; amountCents: number; note?: string };

export type Quote = {
  lines: QuoteLine[];
  subtotalCents: number;
  totalCents: number;
  leadTime: string;
  estimatedDays: { min: number; max: number };
};

export type Turn = {
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  at: string;
};

export type StudioState = { sessionId: string; imageUrl: string; turns: Turn[] };

export type Testimonial = {
  id: string;
  customer: string;
  location: string;
  medium: string;
  size: string;
  rushTier: string;
  rating: number;
  quote: string;
  aiUrl: string;
  paintedUrl: string;
};

export type GalleryPiece = {
  id: string;
  title: string;
  medium: string;
  size: string;
  url: string;
  span: 'tall' | 'wide' | 'square';
};

export type CheckoutResult = {
  orderId: string;
  quote: Quote;
  checkout: { redirectUrl: string; sessionId: string; provider: string; simulated: boolean };
};
