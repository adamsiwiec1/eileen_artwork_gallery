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

export type Address = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
};

export type ShippingRate = {
  id: string;
  carrier: string;
  service: string;
  amountCents: number;
  days?: number | null;
  rushTierId: string;
};

export type OrderStatus =
  | 'pending_review'
  | 'accepted'
  | 'denied'
  | 'in_progress'
  | 'ready_to_ship'
  | 'shipped';

export type Order = {
  id: string;
  sessionId: string;
  status: OrderStatus;
  imageUrl: string;
  brief: string;
  mediumId: string;
  sizeId: string;
  rushTierId: string;
  framed: boolean;
  totalCents: number;
  postageCents: number;
  customerName: string;
  customerEmail: string;
  address: Address;
  easypostShipmentId?: string;
  selectedRateId?: string;
  selectedService?: string;
  labelUrl?: string;
  trackingCode?: string;
  pickupId?: string;
  pickupConfirmation?: string;
  canvasCents: number;
  paintCents: number;
  otherMaterialsCents: number;
  hoursWorked: number;
  hourlyRateCents: number;
  createdAt: string;
};

export type StudioSettings = {
  hourlyRateCents: number;
  defaultCanvasCents: number;
  defaultPaintCents: number;
};

export type CheckoutResult = {
  orderId: string;
  quote: Quote;
  checkout: { redirectUrl: string; sessionId: string; provider: string; simulated: boolean };
};

export function profitCents(order: Order): number {
  const materials = order.canvasCents + order.paintCents + order.otherMaterialsCents;
  const labor = Math.round(order.hoursWorked * order.hourlyRateCents);
  return order.totalCents - materials - labor - order.postageCents;
}
