import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-session';
import { schedulePickup } from '@/lib/easypost';
import { jsonError, readJson } from '@/lib/http';
import { pickupSchema } from '@/lib/schemas';
import { getOrder, updateOrder } from '@/lib/store';
import { profitCents } from '@/lib/types';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await readJson(req, pickupSchema);
    const current = await getOrder(id);
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (!current.labelUrl || !current.easypostShipmentId) {
      return NextResponse.json({ error: 'Buy a label before scheduling a pickup.' }, { status: 400 });
    }

    const pickup = await schedulePickup({
      shipmentId: current.easypostShipmentId,
      min: body.min,
      max: body.max,
      instructions: body.instructions,
    });
    const order = await updateOrder(id, {
      pickupId: pickup.pickupId,
      pickupConfirmation: pickup.confirmation,
    });
    return NextResponse.json({ ...order, profitCents: profitCents(order) });
  } catch (err) {
    return jsonError(err);
  }
}
