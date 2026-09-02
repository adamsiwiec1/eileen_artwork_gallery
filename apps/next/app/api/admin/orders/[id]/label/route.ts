import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-session';
import { buyLabel } from '@/lib/easypost';
import { jsonError } from '@/lib/http';
import { getOrder, updateOrder } from '@/lib/store';
import { profitCents } from '@/lib/types';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const current = await getOrder(id);
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (current.status === 'pending_review' || current.status === 'denied') {
      return NextResponse.json({ error: 'Accept the commission before buying a label.' }, { status: 400 });
    }
    if (!current.easypostShipmentId || !current.selectedRateId) {
      return NextResponse.json({ error: 'This order has no saved shipment rate.' }, { status: 400 });
    }

    const bought = await buyLabel(current.easypostShipmentId, current.selectedRateId);
    const order = await updateOrder(id, {
      labelUrl: bought.labelUrl,
      trackingCode: bought.trackingCode,
      postageCents: bought.postageCents,
      status: current.status === 'ready_to_ship' ? 'shipped' : current.status,
    });
    return NextResponse.json({ ...order, profitCents: profitCents(order) });
  } catch (err) {
    return jsonError(err);
  }
}
