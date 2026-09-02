import { NextResponse } from 'next/server';
import { signInAdmin } from '@/lib/admin-session';
import { jsonError, readJson } from '@/lib/http';
import { adminLoginSchema } from '@/lib/schemas';

export async function POST(req: Request) {
  try {
    const body = await readJson(req, adminLoginSchema);
    await signInAdmin(body.email, body.pass);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
