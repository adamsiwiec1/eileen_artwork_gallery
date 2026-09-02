import { NextResponse } from 'next/server';
import { MEDIUMS, RUSH_TIERS, SIZES } from '@/lib/catalog';

export async function GET() {
  return NextResponse.json({ mediums: MEDIUMS, sizes: SIZES, rushTiers: RUSH_TIERS });
}
