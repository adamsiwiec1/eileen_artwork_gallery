import { createSupabaseAdmin, hasSupabaseAdmin } from './supabase/admin';
import { newId } from './ids';
import type { Address, Order, OrderStatus, StudioSettings, Turn } from './types';

export type Session = {
  id: string;
  turns: Turn[];
  currentImageUrl?: string;
  seed: number;
  brief: string;
  createdAt: string;
};

const DEFAULT_SETTINGS: StudioSettings = {
  hourlyRateCents: 7500,
  defaultCanvasCents: 4500,
  defaultPaintCents: 2800,
};

const memory = ((globalThis as { __eileenStore?: {
  sessions: Map<string, Session>;
  orders: Map<string, Order>;
  settings: StudioSettings;
} }).__eileenStore ??= {
  sessions: new Map<string, Session>(),
  orders: new Map<string, Order>(),
  settings: { ...DEFAULT_SETTINGS },
});

const sessions = memory.sessions;
const orders = memory.orders;
const settingsRef = memory;

function rowToOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    status: row.status as OrderStatus,
    imageUrl: String(row.image_url),
    brief: String(row.brief ?? ''),
    mediumId: String(row.medium_id),
    sizeId: String(row.size_id),
    rushTierId: String(row.rush_tier_id),
    framed: Boolean(row.framed),
    totalCents: Number(row.total_cents),
    postageCents: Number(row.postage_cents ?? 0),
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    address: row.address as Address,
    easypostShipmentId: (row.easypost_shipment_id as string | null) ?? undefined,
    selectedRateId: (row.selected_rate_id as string | null) ?? undefined,
    selectedService: (row.selected_service as string | null) ?? undefined,
    labelUrl: (row.label_url as string | null) ?? undefined,
    trackingCode: (row.tracking_code as string | null) ?? undefined,
    pickupId: (row.pickup_id as string | null) ?? undefined,
    pickupConfirmation: (row.pickup_confirmation as string | null) ?? undefined,
    canvasCents: Number(row.canvas_cents ?? 0),
    paintCents: Number(row.paint_cents ?? 0),
    otherMaterialsCents: Number(row.other_materials_cents ?? 0),
    hoursWorked: Number(row.hours_worked ?? 0),
    hourlyRateCents: Number(row.hourly_rate_cents ?? DEFAULT_SETTINGS.hourlyRateCents),
    createdAt: String(row.created_at),
  };
}

async function persistImage(url: string): Promise<string> {
  if (!url.startsWith('data:')) return url;
  const admin = createSupabaseAdmin();
  if (!admin) return url;

  const match = /^data:([^;]+);base64,(.+)$/.exec(url);
  if (!match) return url;
  const mime = match[1] ?? 'image/jpeg';
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const bytes = Buffer.from(match[2] ?? '', 'base64');
  const path = `paintings/${newId('img')}.${ext}`;

  const { error } = await admin.storage.from('paintings').upload(path, bytes, {
    contentType: mime,
    upsert: false,
  });
  if (error) {
    console.warn('[storage] upload failed, keeping data URL', error.message);
    return url;
  }

  const { data } = admin.storage.from('paintings').getPublicUrl(path);
  return data.publicUrl;
}

export async function createSession(seed: number, brief: string): Promise<Session> {
  const session: Session = {
    id: newId('ses'),
    turns: [],
    seed,
    brief,
    createdAt: new Date().toISOString(),
  };

  const admin = createSupabaseAdmin();
  if (admin) {
    const { error } = await admin.from('studio_sessions').insert({
      id: session.id,
      turns: session.turns,
      seed: session.seed,
      brief: session.brief,
      created_at: session.createdAt,
    });
    if (error) throw error;
  } else {
    sessions.set(session.id, session);
  }
  return session;
}

export async function getSession(id: string): Promise<Session | null> {
  const admin = createSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin.from('studio_sessions').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      turns: data.turns as Turn[],
      currentImageUrl: data.current_image_url ?? undefined,
      seed: data.seed,
      brief: data.brief,
      createdAt: data.created_at,
    };
  }
  return sessions.get(id) ?? null;
}

export async function saveSession(session: Session) {
  const imageUrl = session.currentImageUrl
    ? await persistImage(session.currentImageUrl)
    : session.currentImageUrl;
  session.currentImageUrl = imageUrl;

  const admin = createSupabaseAdmin();
  if (admin) {
    const { error } = await admin.from('studio_sessions').update({
      turns: session.turns,
      current_image_url: session.currentImageUrl ?? null,
      brief: session.brief,
      seed: session.seed,
    }).eq('id', session.id);
    if (error) throw error;
    return session;
  }
  sessions.set(session.id, session);
  return session;
}

export async function getSettings(): Promise<StudioSettings> {
  const admin = createSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin.from('studio_settings').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    if (!data) return { ...DEFAULT_SETTINGS };
    return {
      hourlyRateCents: data.hourly_rate_cents,
      defaultCanvasCents: data.default_canvas_cents,
      defaultPaintCents: data.default_paint_cents,
    };
  }
  return { ...settingsRef.settings };
}

export async function saveSettings(next: StudioSettings): Promise<StudioSettings> {
  const admin = createSupabaseAdmin();
  if (admin) {
    const { error } = await admin.from('studio_settings').upsert({
      id: 1,
      hourly_rate_cents: next.hourlyRateCents,
      default_canvas_cents: next.defaultCanvasCents,
      default_paint_cents: next.defaultPaintCents,
    });
    if (error) throw error;
    return next;
  }
  settingsRef.settings = { ...next };
  return settingsRef.settings;
}

export async function createOrder(input: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  const studio = await getSettings();
  const order: Order = {
    ...input,
    id: newId('ord'),
    createdAt: new Date().toISOString(),
    canvasCents: input.canvasCents || studio.defaultCanvasCents,
    paintCents: input.paintCents || studio.defaultPaintCents,
    hourlyRateCents: input.hourlyRateCents || studio.hourlyRateCents,
    imageUrl: await persistImage(input.imageUrl),
  };

  const admin = createSupabaseAdmin();
  if (admin) {
    const { error } = await admin.from('orders').insert({
      id: order.id,
      session_id: order.sessionId,
      status: order.status,
      image_url: order.imageUrl,
      brief: order.brief,
      medium_id: order.mediumId,
      size_id: order.sizeId,
      rush_tier_id: order.rushTierId,
      framed: order.framed,
      total_cents: order.totalCents,
      postage_cents: order.postageCents,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      address: order.address,
      easypost_shipment_id: order.easypostShipmentId ?? null,
      selected_rate_id: order.selectedRateId ?? null,
      selected_service: order.selectedService ?? null,
      canvas_cents: order.canvasCents,
      paint_cents: order.paintCents,
      other_materials_cents: order.otherMaterialsCents,
      hours_worked: order.hoursWorked,
      hourly_rate_cents: order.hourlyRateCents,
      created_at: order.createdAt,
    });
    if (error) throw error;
    return order;
  }

  orders.set(order.id, order);
  return order;
}

export async function getOrder(id: string): Promise<Order | null> {
  const admin = createSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin.from('orders').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? rowToOrder(data) : null;
  }
  return orders.get(id) ?? null;
}

export async function listOrders(): Promise<Order[]> {
  const admin = createSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin.from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToOrder);
  }
  return [...orders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateOrder(id: string, patch: Partial<Order>): Promise<Order> {
  const current = await getOrder(id);
  if (!current) throw Object.assign(new Error('Order not found'), { status: 404 });
  const next = { ...current, ...patch };

  const admin = createSupabaseAdmin();
  if (admin) {
    const { error } = await admin.from('orders').update({
      status: next.status,
      postage_cents: next.postageCents,
      label_url: next.labelUrl ?? null,
      tracking_code: next.trackingCode ?? null,
      pickup_id: next.pickupId ?? null,
      pickup_confirmation: next.pickupConfirmation ?? null,
      canvas_cents: next.canvasCents,
      paint_cents: next.paintCents,
      other_materials_cents: next.otherMaterialsCents,
      hours_worked: next.hoursWorked,
      hourly_rate_cents: next.hourlyRateCents,
      easypost_shipment_id: next.easypostShipmentId ?? null,
      selected_rate_id: next.selectedRateId ?? null,
      selected_service: next.selectedService ?? null,
    }).eq('id', id);
    if (error) throw error;
    return next;
  }

  orders.set(id, next);
  return next;
}

export function usingSupabase() {
  return hasSupabaseAdmin();
}
