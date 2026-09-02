import { NextResponse } from 'next/server';
import { createChatProvider } from '@/lib/chat';
import { createImageProvider } from '@/lib/image';
import { jsonError, readJson } from '@/lib/http';
import { generateSchema } from '@/lib/schemas';
import { createSession, saveSession } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

const chat = createChatProvider();
const images = createImageProvider();

export async function POST(req: Request) {
  try {
    const { prompt } = await readJson(req, generateSchema);
    const session = await createSession(Math.floor(Math.random() * 1_000_000), prompt);
    const plan = await chat.plan([], prompt);
    const image = await images.render({ prompt: plan.imagePrompt, seed: session.seed });

    session.brief = plan.imagePrompt;
    session.turns.push({ role: 'user', text: prompt, at: new Date().toISOString() });
    session.turns.push({
      role: 'assistant',
      text: plan.reply,
      imageUrl: image.url,
      at: new Date().toISOString(),
    });
    session.currentImageUrl = image.url;
    await saveSession(session);

    return NextResponse.json({ sessionId: session.id, imageUrl: image.url, turns: session.turns });
  } catch (err) {
    return jsonError(err);
  }
}
