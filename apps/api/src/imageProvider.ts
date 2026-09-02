import OpenAI from 'openai';

export type GeneratedImage = {
  /** A data URL (base64 providers) or an absolute URL (Pollinations, mock). */
  url: string;
  /** True when the provider genuinely edited the previous image. */
  edited: boolean;
};

export type ImageRequest = {
  /** A complete description of the desired final painting, not a delta. */
  prompt: string;
  /**
   * Stable for the whole session. Providers that cannot edit reuse it so a
   * re-render keeps roughly the same composition as the prompt evolves.
   */
  seed: number;
  /** The current image, present when refining. */
  previous?: string;
};

export interface ImageProvider {
  readonly name: string;
  /** True if refinements edit the existing image rather than re-rendering. */
  readonly supportsEditing: boolean;
  render(req: ImageRequest): Promise<GeneratedImage>;
}

const STYLE = 'Fine-art painting for a gallery wall, painterly brushwork, no text or watermarks.';

/** Normalises any image reference into raw base64 for providers that need bytes. */
async function toBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    if (url.startsWith('data:')) {
      const [header, data] = url.split(',');
      if (!data) return null;
      return { data, mimeType: header?.match(/data:([^;]+)/)?.[1] ?? 'image/png' };
    }

    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return {
      data: buffer.toString('base64'),
      mimeType: res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg',
    };
  } catch {
    return null;
  }
}

/**
 * Free, no API key, no account.
 *
 * Anonymous access is limited to the `sana` model and has no edit endpoint
 * (`kontext` requires registration), so refinement re-renders from the full
 * evolved prompt while holding the seed constant. Same seed plus a slightly
 * changed prompt keeps a diffusion model's composition broadly stable, which is
 * what makes iterating feel coherent rather than a fresh roll of the dice.
 */
class PollinationsImageProvider implements ImageProvider {
  readonly name = 'pollinations';
  readonly supportsEditing = false;

  async render({ prompt, seed }: ImageRequest): Promise<GeneratedImage> {
    const query = new URLSearchParams({
      model: 'sana',
      width: '1024',
      height: '1024',
      seed: String(seed),
      referrer: process.env.POLLINATIONS_REFERRER ?? 'eileen-gallery',
    });

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      `${STYLE} ${prompt}`,
    )}?${query}`;

    const res = await fetch(url);

    // Anonymous access allows roughly one request every 15 seconds. Say so
    // plainly rather than surfacing a bare 429.
    if (res.status === 429) {
      throw Object.assign(
        new Error(
          'The free image service is rate-limited to one request every ~15 seconds. Give it a moment and try again.',
        ),
        { status: 429 },
      );
    }
    if (!res.ok) throw new Error(`Pollinations returned ${res.status}`);

    // Inlined as a data URL rather than handing the URL to the browser. That
    // keeps it to a single upstream request against the rate limit, and freezes
    // the bytes so an order can't lose its artwork if the URL later changes.
    const buffer = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg';

    return { url: `data:${mime};base64,${buffer.toString('base64')}`, edited: false };
  }
}

/**
 * Free tier, one key from aistudio.google.com, no credit card.
 *
 * The only free option that genuinely edits: passing the previous image back as
 * inlineData refines that painting instead of re-rendering, so composition
 * survives a long back-and-forth.
 */
class GeminiImageProvider implements ImageProvider {
  readonly name = 'gemini';
  readonly supportsEditing = true;

  private model = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image';

  constructor(private apiKey: string) {}

  async render({ prompt, previous }: ImageRequest): Promise<GeneratedImage> {
    const parts: Record<string, unknown>[] = [{ text: `${STYLE}\n\n${prompt}` }];
    let edited = false;

    if (previous) {
      const source = await toBase64(previous);
      if (source) {
        parts.push({ inlineData: { mimeType: source.mimeType, data: source.data } });
        edited = true;
      }
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Gemini image failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const body = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { data: string; mimeType: string } }[] } }[];
    };

    const image = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!image) throw new Error('Gemini returned no image (often a safety block)');

    return { url: `data:${image.mimeType};base64,${image.data}`, edited };
  }
}

/** Paid. Highest quality, and edits properly via the images.edit endpoint. */
class OpenAIImageProvider implements ImageProvider {
  readonly name = 'openai';
  readonly supportsEditing = true;

  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async render({ prompt, previous }: ImageRequest): Promise<GeneratedImage> {
    const source = previous ? await toBase64(previous) : null;

    if (source) {
      const file = await OpenAI.toFile(Buffer.from(source.data, 'base64'), 'painting.png', {
        type: source.mimeType,
      });
      const res = await this.client.images.edit({
        model: 'gpt-image-1',
        image: file,
        prompt: `${STYLE}\n\n${prompt}`,
        size: '1024x1024',
      });
      const b64 = res.data?.[0]?.b64_json;
      if (!b64) throw new Error('OpenAI returned no image data');
      return { url: `data:image/png;base64,${b64}`, edited: true };
    }

    const res = await this.client.images.generate({
      model: 'gpt-image-1',
      prompt: `${STYLE}\n\n${prompt}`,
      size: '1024x1024',
      quality: 'high',
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenAI returned no image data');
    return { url: `data:image/png;base64,${b64}`, edited: false };
  }
}

/**
 * Eileen's trained Flux LoRA, hosted on a Hugging Face ZeroGPU Space.
 * The gallery Studio talks to this the same way it talks to Pollinations.
 * Refinements re-render with a fixed session seed — the Space cannot edit.
 */
class EileenLoraImageProvider implements ImageProvider {
  readonly name = 'eileen';
  readonly supportsEditing = false;

  private space = process.env.SPACE_ID?.trim() ?? '';
  private token = process.env.HF_TOKEN?.trim();
  private steps = Number(process.env.EILEEN_STEPS ?? 28);
  private guidance = Number(process.env.EILEEN_GUIDANCE ?? 3.5);

  constructor(spaceId?: string) {
    if (spaceId) this.space = spaceId;
    if (!this.space) {
      throw new Error('IMAGE_PROVIDER=eileen requires SPACE_ID (Hugging Face Space owner/name)');
    }
  }

  async render({ prompt, seed }: ImageRequest): Promise<GeneratedImage> {
    const host = await resolveSpaceHost(this.space, this.token);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const queued = await fetch(`${host}/gradio_api/call/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: [
          prompt,
          seed,
          Number.isFinite(this.steps) ? this.steps : 28,
          Number.isFinite(this.guidance) ? this.guidance : 3.5,
        ],
      }),
    });

    if (queued.status === 429) {
      throw Object.assign(
        new Error(
          'The style model is rate-limited (ZeroGPU daily quota). Try again later today.',
        ),
        { status: 429 },
      );
    }
    if (!queued.ok) {
      const detail = await queued.text();
      throw Object.assign(
        new Error(`Style Space returned ${queued.status}: ${detail.slice(0, 240)}`),
        { status: 502 },
      );
    }

    const { event_id: eventId } = (await queued.json()) as { event_id?: string };
    if (!eventId) throw new Error('Style Space did not queue the painting');

    const stream = await fetch(`${host}/gradio_api/call/generate/${eventId}`, { headers });
    if (!stream.ok) {
      throw Object.assign(new Error(`Style Space stream failed (${stream.status})`), {
        status: 502,
      });
    }

    const raw = parseGradioComplete(await stream.text());
    const url = await freezeImage(raw, host);
    if (!url) throw new Error('Style Space returned no image');
    return { url, edited: false };
  }
}

async function resolveSpaceHost(space: string, token?: string): Promise<string> {
  if (/^https?:\/\//.test(space) || space.includes('.hf.space')) {
    return space.replace(/\/$/, '').replace(/^(?!https?:\/\/)/, 'https://');
  }

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://huggingface.co/api/spaces/${space}/host`, { headers });
  if (!res.ok) {
    throw Object.assign(
      new Error(
        `Could not reach Hugging Face Space ${space} (${res.status}). Set SPACE_ID to owner/name.`,
      ),
      { status: 502 },
    );
  }

  const body = (await res.json()) as { host?: string };
  if (!body.host) throw new Error(`Hugging Face Space ${space} has no host yet`);
  return `https://${body.host.replace(/^https?:\/\//, '')}`;
}

function parseGradioComplete(sse: string): unknown {
  let event = '';
  for (const line of sse.split(/\r?\n/)) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
      continue;
    }
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    let parsed: unknown = payload;
    try {
      parsed = JSON.parse(payload);
    } catch {
      // keep the raw string
    }
    if (event === 'error') {
      const message =
        typeof parsed === 'object' && parsed && 'error' in parsed
          ? String((parsed as { error: unknown }).error)
          : payload;
      throw Object.assign(new Error(message), { status: 502 });
    }
    if (event === 'complete' || event === 'generating') {
      return Array.isArray(parsed) ? parsed[0] : parsed;
    }
  }
  throw new Error('Style Space finished without an image');
}

function asImageRef(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    if (value.startsWith('data:') || value.startsWith('http')) return value;
    return `data:image/png;base64,${value}`;
  }
  if (typeof value === 'object') {
    const rec = value as { url?: string; path?: string };
    if (typeof rec.url === 'string') return rec.url;
    if (typeof rec.path === 'string') return rec.path;
  }
  return null;
}

async function freezeImage(value: unknown, host: string): Promise<string | null> {
  const ref = asImageRef(value);
  if (!ref) return null;
  if (ref.startsWith('data:')) return ref;

  const absolute = ref.startsWith('http')
    ? ref
    : `${host}${ref.startsWith('/') ? '' : '/'}${ref}`;
  const res = await fetch(absolute);
  if (!res.ok) return absolute;
  const buffer = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get('content-type')?.split(';')[0] ?? 'image/png';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

/** Offline placeholder. No network calls, so demos stay hermetic. */
class MockImageProvider implements ImageProvider {
  readonly name = 'mock';
  readonly supportsEditing = false;

  async render({ prompt, seed }: ImageRequest): Promise<GeneratedImage> {
    await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 600));
    let hash = seed;
    for (const ch of prompt) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
    return { url: `https://picsum.photos/seed/eileen-${Math.abs(hash)}/1024/1024`, edited: false };
  }
}

export function createImageProvider(): ImageProvider {
  const explicit = process.env.IMAGE_PROVIDER;
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const spaceId = process.env.SPACE_ID?.trim();

  const chosen =
    explicit ??
    (spaceId ? 'eileen' : undefined) ??
    (geminiKey ? 'gemini' : undefined) ??
    (openaiKey ? 'openai' : undefined) ??
    'pollinations';

  switch (chosen) {
    case 'mock':
      console.log('[images] mock — offline placeholders');
      return new MockImageProvider();

    case 'eileen':
    case 'eileen-lora':
    case 'lora':
      if (!spaceId) {
        throw new Error('IMAGE_PROVIDER=eileen requires SPACE_ID (Hugging Face Space owner/name)');
      }
      console.log(`[images] eileen — ZeroGPU Space ${spaceId}`);
      return new EileenLoraImageProvider(spaceId);

    case 'gemini':
      if (!geminiKey) throw new Error('IMAGE_PROVIDER=gemini requires GEMINI_API_KEY');
      console.log('[images] gemini — free tier, true image editing');
      return new GeminiImageProvider(geminiKey);

    case 'openai':
      if (!openaiKey) throw new Error('IMAGE_PROVIDER=openai requires OPENAI_API_KEY');
      console.log('[images] openai gpt-image-1 — paid');
      return new OpenAIImageProvider(openaiKey);

    default:
      console.log('[images] pollinations — free, no key, re-renders on refine');
      return new PollinationsImageProvider();
  }
}
