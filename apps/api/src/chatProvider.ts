/**
 * The conversational layer.
 *
 * An image model on its own handles deltas badly: feeding it "warmer light"
 * discards the subject entirely, and naively concatenating every instruction
 * produces a contradictory run-on prompt. So an LLM sits in front of it, holding
 * the conversation and rewriting the whole brief into one coherent prompt after
 * each turn. It also writes the assistant's reply, which is what makes the
 * studio feel like a conversation rather than a form.
 */

export type Turn = { role: 'user' | 'assistant'; text: string };

export type Plan = {
  /** A complete, self-contained description of the desired painting. */
  imagePrompt: string;
  /** What the assistant says back to the customer. */
  reply: string;
};

export interface ChatProvider {
  readonly name: string;
  plan(history: Turn[], instruction: string): Promise<Plan>;
}

const SYSTEM = `You are the studio assistant for a commissioned-painting service.
A customer describes a painting and refines it conversationally.

After each message, return a COMPLETE image prompt describing the whole painting
as it should now look — never a delta, never "the same but warmer". Carry forward
every detail already established that the customer has not overridden. Keep it
under 120 words, concrete and visual: subject, composition, light, palette, mood.

Also write a short reply to the customer: one or two warm, plain sentences about
what you changed, then invite further refinement. Never mention prompts, models
or AI.

Respond with ONLY a JSON object: {"imagePrompt": "...", "reply": "..."}`;

/** Tolerates prose or fences around the JSON, which small models often add. */
function parsePlan(raw: string): Plan | null {
  const attempt = (text: string): Plan | null => {
    try {
      const value = JSON.parse(text) as Partial<Plan>;
      if (typeof value.imagePrompt === 'string' && value.imagePrompt.trim()) {
        return {
          imagePrompt: value.imagePrompt.trim(),
          reply:
            typeof value.reply === 'string' && value.reply.trim()
              ? value.reply.trim()
              : 'Updated — tell me what else to change.',
        };
      }
    } catch {
      /* fall through to the next strategy */
    }
    return null;
  };

  const direct = attempt(raw.trim());
  if (direct) return direct;

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    const parsed = attempt(fenced[1].trim());
    if (parsed) return parsed;
  }

  const braced = raw.match(/\{[\s\S]*\}/);
  return braced ? attempt(braced[0]) : null;
}

/**
 * Merges instructions without a model: later turns win on conflict only in the
 * sense that they are appended, which a diffusion model tends to weight more
 * heavily. Crude, but it keeps the studio usable with no keys and no network.
 */
class HeuristicChatProvider implements ChatProvider {
  readonly name = 'heuristic';

  async plan(history: Turn[], instruction: string): Promise<Plan> {
    const briefs = history.filter((t) => t.role === 'user').map((t) => t.text);
    const first = briefs.length === 0;

    return {
      imagePrompt: [...briefs, instruction].join('. '),
      reply: first
        ? 'Here is a first pass. Tell me what to change — subject, palette, light, composition, anything.'
        : 'Updated. Keep refining, or lock it in and choose your medium and size.',
    };
  }
}

/** Shared logic for any OpenAI-compatible chat endpoint (Groq, OpenAI, others). */
class OpenAICompatibleChatProvider implements ChatProvider {
  constructor(
    readonly name: string,
    private baseUrl: string,
    private apiKey: string,
    private model: string,
  ) {}

  async plan(history: Turn[], instruction: string): Promise<Plan> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          ...history.map((t) => ({
            role: t.role === 'assistant' ? 'assistant' : 'user',
            content: t.text,
          })),
          { role: 'user', content: instruction },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`${this.name} chat failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    }

    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content ?? '';
    const parsed = parsePlan(content);
    if (!parsed) throw new Error(`${this.name} returned unparseable JSON`);
    return parsed;
  }
}

/** Free tier, no credit card. Same key as the Gemini image provider. */
class GeminiChatProvider implements ChatProvider {
  readonly name = 'gemini';

  private model = process.env.GEMINI_CHAT_MODEL ?? 'gemini-2.5-flash';

  constructor(private apiKey: string) {}

  async plan(history: Turn[], instruction: string): Promise<Plan> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify({
          // Gemini calls the assistant role "model" and takes the system prompt
          // as a separate top-level field rather than a message.
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [
            ...history.map((t) => ({
              role: t.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: t.text }],
            })),
            { role: 'user', parts: [{ text: instruction }] },
          ],
          generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
        }),
      },
    );

    if (!res.ok) {
      throw new Error(`Gemini chat failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    }

    const body = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const content = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    const parsed = parsePlan(content);
    if (!parsed) throw new Error('Gemini returned unparseable JSON');
    return parsed;
  }
}

/**
 * Wraps a provider so a chat failure degrades the experience instead of
 * breaking it. A rate-limited free tier is expected, not exceptional — losing
 * prompt rewriting is survivable, losing the whole generate button is not.
 */
class FallbackChatProvider implements ChatProvider {
  private fallback = new HeuristicChatProvider();

  constructor(private primary: ChatProvider) {}

  get name() {
    return `${this.primary.name}+heuristic`;
  }

  async plan(history: Turn[], instruction: string): Promise<Plan> {
    try {
      return await this.primary.plan(history, instruction);
    } catch (err) {
      console.warn('[chat] falling back to heuristic:', (err as Error).message);
      return this.fallback.plan(history, instruction);
    }
  }
}

export function createChatProvider(): ChatProvider {
  const explicit = process.env.CHAT_PROVIDER;
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  const chosen =
    explicit ??
    (geminiKey ? 'gemini' : undefined) ??
    (groqKey ? 'groq' : undefined) ??
    (openaiKey ? 'openai' : undefined) ??
    'heuristic';

  switch (chosen) {
    case 'gemini':
      if (!geminiKey) throw new Error('CHAT_PROVIDER=gemini requires GEMINI_API_KEY');
      console.log('[chat] gemini — free tier');
      return new FallbackChatProvider(new GeminiChatProvider(geminiKey));

    case 'groq':
      if (!groqKey) throw new Error('CHAT_PROVIDER=groq requires GROQ_API_KEY');
      console.log('[chat] groq — free tier');
      return new FallbackChatProvider(
        new OpenAICompatibleChatProvider(
          'groq',
          'https://api.groq.com/openai/v1',
          groqKey,
          process.env.GROQ_CHAT_MODEL ?? 'llama-3.3-70b-versatile',
        ),
      );

    case 'openai':
      if (!openaiKey) throw new Error('CHAT_PROVIDER=openai requires OPENAI_API_KEY');
      console.log('[chat] openai — paid');
      return new FallbackChatProvider(
        new OpenAICompatibleChatProvider(
          'openai',
          'https://api.openai.com/v1',
          openaiKey,
          process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
        ),
      );

    default:
      console.log('[chat] heuristic — no LLM, instructions concatenated');
      return new HeuristicChatProvider();
  }
}
