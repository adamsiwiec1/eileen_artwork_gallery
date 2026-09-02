import { NextResponse } from 'next/server';
import { jsonError, readJson } from '@/lib/http';
import { quoteWithShipping } from '@/lib/pricing';
import { quoteSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  try {
    const body = await readJson(req, quoteSchema);
    return NextResponse.json(
      quoteWithShipping(body, {
        amountCents: body.shippingCents ?? 0,
        label: body.shippingLabel ?? 'Shipping',
      }),
    );
  } catch (err) {
    return jsonError(err);
  }
}
