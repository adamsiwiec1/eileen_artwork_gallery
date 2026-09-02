import { NextResponse } from 'next/server';
import { shopRates } from '@/lib/easypost';
import { jsonError, readJson } from '@/lib/http';
import { quoteWithShipping } from '@/lib/pricing';
import { checkoutSchema } from '@/lib/schemas';
import { createOrder, getSession } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await readJson(req, checkoutSchema);
    const session = await getSession(body.sessionId);
    if (!session?.currentImageUrl) {
      return NextResponse.json({ error: 'No finished artwork on this session.' }, { status: 404 });
    }

    const shopped = body.easypostShipmentId
      ? { shipmentId: body.easypostShipmentId, rates: [] as Awaited<ReturnType<typeof shopRates>>['rates'] }
      : await shopRates(body.address);

    const rates = shopped.rates.length
      ? shopped.rates
      : (await shopRates(body.address)).rates;

    const selected =
      rates.find((rate) => rate.id === body.selectedRateId) ??
      rates.find((rate) => rate.rushTierId === body.rushTierId) ??
      rates[0];

    if (!selected) {
      return NextResponse.json({ error: 'No shipping rates available for that address.' }, { status: 400 });
    }

    const quote = quoteWithShipping(body, {
      amountCents: selected.amountCents,
      label: `${selected.carrier} ${selected.service}`,
    });

    const order = await createOrder({
      sessionId: body.sessionId,
      status: 'pending_review',
      imageUrl: session.currentImageUrl,
      brief: session.brief,
      mediumId: body.mediumId,
      sizeId: body.sizeId,
      rushTierId: body.rushTierId,
      framed: body.framed,
      totalCents: quote.totalCents,
      postageCents: 0,
      customerName: body.name,
      customerEmail: body.email,
      address: body.address,
      easypostShipmentId: shopped.shipmentId || body.easypostShipmentId,
      selectedRateId: selected.id,
      selectedService: `${selected.carrier} ${selected.service}`,
      canvasCents: 0,
      paintCents: 0,
      otherMaterialsCents: 0,
      hoursWorked: 0,
      hourlyRateCents: 0,
    });

    return NextResponse.json({
      orderId: order.id,
      quote,
      checkout: {
        redirectUrl: `/studio/complete?order=${order.id}`,
        sessionId: `sim_${order.id}`,
        provider: 'simulated',
        simulated: true,
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
