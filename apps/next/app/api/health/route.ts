import { NextResponse } from 'next/server';
import { createImageProvider } from '@/lib/image';
import { createChatProvider } from '@/lib/chat';
import { usingSupabase } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const images = createImageProvider();
  const chat = createChatProvider();
  return NextResponse.json({
    ok: true,
    imageProvider: images.name,
    supportsEditing: images.supportsEditing,
    chatProvider: chat.name,
    store: usingSupabase() ? 'supabase' : 'memory',
    easypost: Boolean(process.env.EASYPOST_TEST_API_KEY || process.env.EASYPOST_API_KEY),
  });
}
