/**
 * Single source of truth for everything purchasable.
 *
 * Prices live server-side only. The client fetches this catalog to render
 * options, but every quote is recomputed here at order time so a tampered
 * client payload can't change what gets charged.
 */

export type Medium = {
  id: string;
  name: string;
  blurb: string;
  /** Multiplier applied to the size's base price. */
  priceMultiplier: number;
  /** Extra days this medium adds to production, before rush tiers apply. */
  extraDays: number;
  texture: string;
};

export type Size = {
  id: string;
  name: string;
  inches: string;
  basePriceCents: number;
  /** Aspect ratio hint so the studio canvas can preview the true crop. */
  aspect: number;
};

export type RushTier = {
  id: string;
  name: string;
  leadTime: string;
  minDays: number;
  maxDays: number;
  /** Surcharge as a fraction of the artwork subtotal. */
  surchargePct: number;
  flatFeeCents: number;
  description: string;
};

export const MEDIUMS: Medium[] = [
  {
    id: 'oil',
    name: 'Oil on Canvas',
    blurb: 'Deep, buttery pigment with visible brushwork. The classic gallery finish.',
    priceMultiplier: 1.0,
    extraDays: 0,
    texture: 'Heavy tooth, gallery-wrapped',
  },
  {
    id: 'acrylic',
    name: 'Acrylic on Canvas',
    blurb: 'Bright, saturated and fast-drying. Crisp edges and bold colour fields.',
    priceMultiplier: 0.85,
    extraDays: -2,
    texture: 'Medium tooth, gallery-wrapped',
  },
  {
    id: 'watercolour',
    name: 'Watercolour on Cotton Rag',
    blurb: 'Luminous washes and soft bleed. Delicate, airy and full of light.',
    priceMultiplier: 0.75,
    extraDays: -3,
    texture: '300gsm cold-press, deckled edge',
  },
  {
    id: 'charcoal',
    name: 'Charcoal & Graphite',
    blurb: 'Monochrome drama. Smoky gradients with sharp, deliberate highlights.',
    priceMultiplier: 0.65,
    extraDays: -4,
    texture: 'Toned paper, fixed and sealed',
  },
  {
    id: 'goldleaf',
    name: 'Oil with Gold Leaf',
    blurb: 'Hand-laid 23k gold leaf over oil. Byzantine glow, genuinely opulent.',
    priceMultiplier: 1.65,
    extraDays: 6,
    texture: 'Heavy tooth, burnished gilding',
  },
];

export const SIZES: Size[] = [
  { id: 'sm', name: 'Studio', inches: '12 × 16 in', basePriceCents: 24000, aspect: 12 / 16 },
  { id: 'md', name: 'Salon', inches: '18 × 24 in', basePriceCents: 42000, aspect: 18 / 24 },
  { id: 'lg', name: 'Statement', inches: '24 × 36 in', basePriceCents: 68000, aspect: 24 / 36 },
  { id: 'xl', name: 'Grand', inches: '36 × 48 in', basePriceCents: 112000, aspect: 36 / 48 },
];

export const RUSH_TIERS: RushTier[] = [
  {
    id: 'standard',
    name: 'Standard',
    leadTime: '14–30 days',
    minDays: 14,
    maxDays: 30,
    surchargePct: 0,
    flatFeeCents: 0,
    description: 'Your piece joins the studio queue in the order it was received.',
  },
  {
    id: 'priority',
    name: 'Priority',
    leadTime: '7–10 days',
    minDays: 7,
    maxDays: 10,
    surchargePct: 0.22,
    flatFeeCents: 4500,
    description: 'Moved ahead of standard commissions and painted within the week.',
  },
  {
    id: 'express',
    name: 'Express',
    leadTime: '3–5 days',
    minDays: 3,
    maxDays: 5,
    surchargePct: 0.48,
    flatFeeCents: 9500,
    description: 'Studio clears the bench for you. Overnight shipping included.',
  },
];

export type QuoteRequest = {
  mediumId: string;
  sizeId: string;
  rushTierId: string;
  framed: boolean;
};

export type QuoteLine = { label: string; amountCents: number; note?: string };

export type Quote = {
  lines: QuoteLine[];
  subtotalCents: number;
  totalCents: number;
  leadTime: string;
  estimatedDays: { min: number; max: number };
};

const FRAME_FEE_BY_SIZE: Record<string, number> = {
  sm: 8000,
  md: 12000,
  lg: 18000,
  xl: 26000,
};

export function buildQuote(req: QuoteRequest): Quote {
  const medium = MEDIUMS.find((m) => m.id === req.mediumId);
  const size = SIZES.find((s) => s.id === req.sizeId);
  const rush = RUSH_TIERS.find((r) => r.id === req.rushTierId);

  if (!medium || !size || !rush) {
    throw Object.assign(new Error('Unknown medium, size or rush tier'), { status: 400 });
  }

  // The rush tier sets the floor we commit to; medium complexity can only push
  // that floor later, never earlier, so a simple medium can't turn Express into
  // an overnight promise we cannot keep. A quicker medium instead pulls in the
  // ceiling, finishing early within the window. Everything user-facing quotes
  // this shifted window rather than the tier baseline, so no line on the
  // receipt can advertise a date we haven't committed to.
  const min = rush.minDays + Math.max(0, medium.extraDays);
  const max = Math.max(min + 2, rush.maxDays + medium.extraDays);
  const leadTime = `${min}–${max} days`;

  const artworkCents = Math.round(size.basePriceCents * medium.priceMultiplier);
  const lines: QuoteLine[] = [
    {
      label: `${medium.name} — ${size.name} (${size.inches})`,
      amountCents: artworkCents,
    },
  ];

  if (req.framed) {
    lines.push({
      label: 'Hand-finished hardwood frame',
      amountCents: FRAME_FEE_BY_SIZE[size.id] ?? 12000,
    });
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);

  if (rush.surchargePct > 0 || rush.flatFeeCents > 0) {
    lines.push({
      label: `${rush.name} production (${leadTime})`,
      amountCents: Math.round(subtotalCents * rush.surchargePct) + rush.flatFeeCents,
      note: rush.description,
    });
  }

  const totalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);

  return { lines, subtotalCents, totalCents, leadTime, estimatedDays: { min, max } };
}
