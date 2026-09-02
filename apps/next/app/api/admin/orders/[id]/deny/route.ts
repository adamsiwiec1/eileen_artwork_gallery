import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-session';
import { sendStatusEmail } from '@/lib/email';
import { jsonError } from '@/lib/http';
import { getOrder, updateOrder } from '@/lib/store';
import { profitCents } from '@/lib/types';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const current = await getOrder(id);
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const order = await updateOrder(id, { status: 'denied' });
    await sendStatusEmail({ to: order.customerEmail, orderId: order.id, preset: 'denied' });
    return NextResponse.json({ ...order, profitCents: profitCents(order) });
  } catch (err) {
    return jsonError(err);
  }
}
