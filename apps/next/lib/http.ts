import { NextResponse } from 'next/server';
import { z } from 'zod';

export function jsonError(err: unknown) {
  if (err instanceof z.ZodError) {
    return NextResponse.json({ error: 'Invalid request', issues: err.issues }, { status: 400 });
  }
  const status = (err as { status?: number })?.status ?? 500;
  const message = err instanceof Error ? err.message : 'Unexpected error';
  if (status >= 500) console.error('[api]', err);
  return NextResponse.json({ error: message }, { status });
}

export async function readJson<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  return schema.parse(await req.json());
}
