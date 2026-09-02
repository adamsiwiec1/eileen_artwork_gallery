import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-session';
import { jsonError, readJson } from '@/lib/http';
import { orderCostsSchema } from '@/lib/schemas';
import { getOrder, updateOrder } from '@/lib/store';
import { profitCents } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const order = await getOrder(id);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ ...order, profitCents: profitCents(order) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await readJson(req, orderCostsSchema);
    const order = await updateOrder(id, body);
    return NextResponse.json({ ...order, profitCents: profitCents(order) });
  } catch (err) {
    return jsonError(err);
  }
}
