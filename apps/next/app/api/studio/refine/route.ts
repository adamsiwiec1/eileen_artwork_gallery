import { NextResponse } from 'next/server';
import { createChatProvider } from '@/lib/chat';
import { createImageProvider } from '@/lib/image';
import { jsonError, readJson } from '@/lib/http';
import { refineSchema } from '@/lib/schemas';
import { getSession, saveSession } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

const chat = createChatProvider();
const images = createImageProvider();

export async function POST(req: Request) {
  try {
    const { sessionId, instruction } = await readJson(req, refineSchema);
    const session = await getSession(sessionId);

    if (!session?.currentImageUrl) {
      return NextResponse.json({ error: 'Session not found. Start a new painting.' }, { status: 404 });
    }

    const plan = await chat.plan(
      session.turns.map((t) => ({ role: t.role, text: t.text })),
      instruction,
    );
    const image = await images.render({
      prompt: plan.imagePrompt,
      seed: session.seed,
      previous: session.currentImageUrl,
    });

    session.brief = plan.imagePrompt;
    session.turns.push({ role: 'user', text: instruction, at: new Date().toISOString() });
    session.turns.push({
      role: 'assistant',
      text: plan.reply,
      imageUrl: image.url,
      at: new Date().toISOString(),
    });
    session.currentImageUrl = image.url;
    await saveSession(session);

    return NextResponse.json({ sessionId, imageUrl: image.url, turns: session.turns });
  } catch (err) {
    return jsonError(err);
  }
}
