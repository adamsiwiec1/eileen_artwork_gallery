import { NextResponse } from 'next/server';
import { shopRates } from '@/lib/easypost';
import { jsonError, readJson } from '@/lib/http';
import { ratesSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { address } = await readJson(req, ratesSchema);
    const result = await shopRates(address);
    return NextResponse.json(result);
  } catch (err) {
    return jsonError(err);
  }
}
