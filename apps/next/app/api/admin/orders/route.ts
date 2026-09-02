import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-session';
import { jsonError } from '@/lib/http';
import { listOrders } from '@/lib/store';
import { profitCents } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const orders = await listOrders();
    return NextResponse.json({
      orders: orders.map((order) => ({ ...order, profitCents: profitCents(order) })),
    });
  } catch (err) {
    return jsonError(err);
  }
}
