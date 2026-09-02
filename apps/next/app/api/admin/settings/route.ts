import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-session';
import { jsonError, readJson } from '@/lib/http';
import { settingsSchema } from '@/lib/schemas';
import { getSettings, saveSettings } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await getSettings());
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await readJson(req, settingsSchema);
    return NextResponse.json(await saveSettings(body));
  } catch (err) {
    return jsonError(err);
  }
}
