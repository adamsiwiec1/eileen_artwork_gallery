import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-session';
import { sendStatusEmail } from '@/lib/email';
import { jsonError, readJson } from '@/lib/http';
import { emailSchema } from '@/lib/schemas';
import { getOrder, updateOrder } from '@/lib/store';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await readJson(req, emailSchema);
    const current = await getOrder(id);
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const result = await sendStatusEmail({
      to: current.customerEmail,
      orderId: current.id,
      preset: body.preset,
      note: body.note,
    });

    const statusMap = {
      accepted: 'accepted',
      in_progress: 'in_progress',
      ready_to_ship: 'ready_to_ship',
      shipped: 'shipped',
      denied: 'denied',
    } as const;
    const order = await updateOrder(id, { status: statusMap[body.preset] });
    return NextResponse.json({ order, email: result });
  } catch (err) {
    return jsonError(err);
  }
}
