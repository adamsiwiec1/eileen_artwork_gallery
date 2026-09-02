import type { Address, ShippingRate } from './types';

const FROM: Address = {
  name: process.env.STUDIO_NAME ?? 'Eileen Atelier',
  street1: process.env.STUDIO_STREET1 ?? '179 N Harbor Dr',
  city: process.env.STUDIO_CITY ?? 'Redondo Beach',
  state: process.env.STUDIO_STATE ?? 'CA',
  zip: process.env.STUDIO_ZIP ?? '90277',
  country: process.env.STUDIO_COUNTRY ?? 'US',
  phone: process.env.STUDIO_PHONE ?? '5555550100',
};

function mapRush(service: string, days?: number | null): string {
  const d = days ?? 7;
  if (d <= 3 || /express|overnight|priority overnight/i.test(service)) return 'express';
  if (d <= 7 || /priority|expedited/i.test(service)) return 'priority';
  return 'standard';
}

function mockRates(): { shipmentId: string; rates: ShippingRate[] } {
  return {
    shipmentId: `shp_mock_${Date.now().toString(36)}`,
    rates: [
      { id: 'rate_std', carrier: 'USPS', service: 'GroundAdvantage', amountCents: 1200, days: 6, rushTierId: 'standard' },
      { id: 'rate_pri', carrier: 'USPS', service: 'Priority', amountCents: 1800, days: 3, rushTierId: 'priority' },
      { id: 'rate_exp', carrier: 'USPS', service: 'Express', amountCents: 4200, days: 1, rushTierId: 'express' },
    ],
  };
}

export async function shopRates(to: Address): Promise<{ shipmentId: string; rates: ShippingRate[] }> {
  const key = process.env.EASYPOST_TEST_API_KEY?.trim() || process.env.EASYPOST_API_KEY?.trim();
  if (!key) return mockRates();

  const EasyPost = (await import('@easypost/api')).default;
  const client = new EasyPost(key);
  const shipment = await client.Shipment.create({
    from_address: FROM,
    to_address: {
      name: to.name,
      street1: to.street1,
      street2: to.street2,
      city: to.city,
      state: to.state,
      zip: to.zip,
      country: to.country || 'US',
      phone: to.phone,
    },
    parcel: {
      length: 24,
      width: 18,
      height: 3,
      weight: 48,
    },
  });

  const rates: ShippingRate[] = (shipment.rates ?? []).map((rate: {
    id: string;
    carrier: string;
    service: string;
    rate: string;
    delivery_days?: number | null;
  }) => ({
    id: rate.id,
    carrier: rate.carrier,
    service: rate.service,
    amountCents: Math.round(Number(rate.rate) * 100),
    days: rate.delivery_days ?? null,
    rushTierId: mapRush(rate.service, rate.delivery_days),
  }));

  const picked = ['standard', 'priority', 'express']
    .map((tier) => rates.filter((r) => r.rushTierId === tier).sort((a, b) => a.amountCents - b.amountCents)[0])
    .filter(Boolean) as ShippingRate[];

  return { shipmentId: shipment.id as string, rates: picked.length ? picked : rates.slice(0, 3) };
}

export async function buyLabel(shipmentId: string, rateId: string) {
  const key = process.env.EASYPOST_TEST_API_KEY?.trim() || process.env.EASYPOST_API_KEY?.trim();
  if (!key || shipmentId.startsWith('shp_mock_')) {
    return {
      labelUrl: 'https://easypost-files.s3.us-west-2.amazonaws.com/files/postage_label/test.png',
      trackingCode: `TEST${Date.now().toString(36).toUpperCase()}`,
      postageCents: rateId === 'rate_exp' ? 4200 : rateId === 'rate_pri' ? 1800 : 1200,
    };
  }

  const EasyPost = (await import('@easypost/api')).default;
  const client = new EasyPost(key);
  const bought = await client.Shipment.buy(shipmentId, rateId);
  return {
    labelUrl: bought.postage_label?.label_url as string | undefined,
    trackingCode: bought.tracking_code as string | undefined,
    postageCents: Math.round(Number(bought.selected_rate?.rate ?? 0) * 100),
  };
}

export async function schedulePickup(input: {
  shipmentId: string;
  min: string;
  max: string;
  instructions?: string;
}) {
  const key = process.env.EASYPOST_TEST_API_KEY?.trim() || process.env.EASYPOST_API_KEY?.trim();
  if (!key || input.shipmentId.startsWith('shp_mock_')) {
    return { pickupId: `pickup_mock_${Date.now().toString(36)}`, confirmation: 'TEST-PICKUP', rates: [] };
  }

  const EasyPost = (await import('@easypost/api')).default;
  const client = new EasyPost(key);
  const pickup = await client.Pickup.create({
    address: FROM,
    shipment: input.shipmentId,
    min_datetime: input.min,
    max_datetime: input.max,
    instructions: input.instructions ?? 'Ring the studio bell.',
    is_account_address: true,
  });

  const first = pickup.pickup_rates?.[0];
  if (first) {
    const bought = await client.Pickup.buy(pickup.id, first.carrier, first.service);
    return {
      pickupId: bought.id as string,
      confirmation: bought.confirmation as string | undefined,
      rates: pickup.pickup_rates ?? [],
    };
  }

  return { pickupId: pickup.id as string, confirmation: pickup.confirmation as string | undefined, rates: [] };
}
