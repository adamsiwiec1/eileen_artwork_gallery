import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { z } from 'zod';

import { MEDIUMS, RUSH_TIERS, SIZES, buildQuote } from './catalog.js';
import { GALLERY, TESTIMONIALS } from './testimonials.js';
import { createImageProvider } from './imageProvider.js';
import { createChatProvider } from './chatProvider.js';
import { createPaymentProvider } from './paymentProvider.js';

const PORT = Number(process.env.PORT ?? 4000);

/**
 * Comma-separated list, because production has more than one legitimate origin:
 * the custom domain, the *.pages.dev production alias, and localhost for
 * debugging against the deployed API. The first entry is used when building
 * absolute URLs for checkout redirects.
 */
const WEB_ORIGINS = (process.env.WEB_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const WEB_ORIGIN = WEB_ORIGINS[0] ?? 'http://localhost:5173';

const ALLOW_PREVIEWS = process.env.ALLOW_PAGES_PREVIEWS !== 'false';

/**
 * Cloudflare Pages serves branch and commit previews from
 * `<commit-or-branch>.<project>.pages.dev` — note the extra label, which a
 * single-label pattern misses.
 *
 * The pattern is derived from whichever `*.pages.dev` origin is configured, so
 * previews of this project are allowed without opening the API to every site
 * hosted on pages.dev.
 */
const PREVIEW_PATTERNS = WEB_ORIGINS.flatMap((origin) => {
  const project = /^https:\/\/([a-z0-9-]+)\.pages\.dev$/.exec(origin)?.[1];
  return project ? [new RegExp(`^https://[a-z0-9-]+\\.${project}\\.pages\\.dev$`)] : [];
});

const isPreviewOrigin = (origin: string) =>
  ALLOW_PREVIEWS && PREVIEW_PATTERNS.some((pattern) => pattern.test(origin));

const images = createImageProvider();
const chat = createChatProvider();
const payments = createPaymentProvider();

const app = express();

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // Same-origin navigations and non-browser clients (curl, health checks,
      // server-to-server) send no Origin header at all.
      if (!origin) return callback(null, true);
      if (WEB_ORIGINS.includes(origin)) return callback(null, true);
      if (isPreviewOrigin(origin)) return callback(null, true);

      // Deny by omitting the header rather than throwing. Throwing here would
      // surface as a 500 and imply the server broke, when the correct outcome is
      // the browser blocking the response itself.
      callback(null, false);
    },
  }),
);
// Generated images come back as base64 data URLs, which blow past the default
// 100kb body limit as soon as one is echoed back for an edit.
app.use(express.json({ limit: '25mb' }));

// ---------------------------------------------------------------------------
// In-memory stores. Swap for Postgres/Redis before this sees real traffic:
// every session and order is lost on restart.
// ---------------------------------------------------------------------------

type Turn = {
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  at: string;
};

type Session = {
  id: string;
  turns: Turn[];
  currentImageUrl?: string;
  /** Held constant so providers that re-render keep the composition stable. */
  seed: number;
  /** Latest full image prompt, as rewritten by the chat layer. */
  brief: string;
  createdAt: string;
};
type Order = {
  id: string;
  sessionId: string;
  imageUrl: string;
  mediumId: string;
  sizeId: string;
  rushTierId: string;
  framed: boolean;
  totalCents: number;
  customer: { name: string; email: string };
  status: 'pending_payment' | 'paid' | 'failed';
  createdAt: string;
};

const sessions = new Map<string, Session>();
const orders = new Map<string, Order>();

const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// ---------------------------------------------------------------------------
// Catalog + marketing content
// ---------------------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    imageProvider: images.name,
    supportsEditing: images.supportsEditing,
    chatProvider: chat.name,
    paymentProvider: payments.name,
  });
});

app.get('/api/catalog', (_req, res) => {
  res.json({ mediums: MEDIUMS, sizes: SIZES, rushTiers: RUSH_TIERS });
});

app.get('/api/testimonials', (_req, res) => res.json({ testimonials: TESTIMONIALS }));
app.get('/api/gallery', (_req, res) => res.json({ pieces: GALLERY }));

// ---------------------------------------------------------------------------
// Studio: generate, then refine conversationally
// ---------------------------------------------------------------------------

const generateSchema = z.object({ prompt: z.string().trim().min(3).max(2000) });

app.post('/api/studio/generate', async (req, res, next) => {
  try {
    const { prompt } = generateSchema.parse(req.body);

    const session: Session = {
      id: newId('ses'),
      turns: [],
      seed: Math.floor(Math.random() * 1_000_000),
      brief: prompt,
      createdAt: new Date().toISOString(),
    };

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
    sessions.set(session.id, session);

    res.json({ sessionId: session.id, imageUrl: image.url, turns: session.turns });
  } catch (err) {
    next(err);
  }
});

const refineSchema = z.object({
  sessionId: z.string(),
  instruction: z.string().trim().min(2).max(2000),
});

app.post('/api/studio/refine', async (req, res, next) => {
  try {
    const { sessionId, instruction } = refineSchema.parse(req.body);
    const session = sessions.get(sessionId);

    if (!session || !session.currentImageUrl) {
      return res.status(404).json({ error: 'Session not found. Start a new painting.' });
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

    res.json({ sessionId, imageUrl: image.url, turns: session.turns });
  } catch (err) {
    next(err);
  }
});

app.get('/api/studio/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// ---------------------------------------------------------------------------
// Quote + checkout
// ---------------------------------------------------------------------------

const quoteSchema = z.object({
  mediumId: z.string(),
  sizeId: z.string(),
  rushTierId: z.string(),
  framed: z.boolean().default(false),
});

app.post('/api/quote', (req, res, next) => {
  try {
    res.json(buildQuote(quoteSchema.parse(req.body)));
  } catch (err) {
    next(err);
  }
});

const checkoutSchema = quoteSchema.extend({
  sessionId: z.string(),
  name: z.string().trim().min(1).max(120),
  email: z.email(),
});

app.post('/api/checkout', async (req, res, next) => {
  try {
    const body = checkoutSchema.parse(req.body);
    const session = sessions.get(body.sessionId);

    if (!session?.currentImageUrl) {
      return res.status(404).json({ error: 'No finished artwork on this session.' });
    }

    // Recompute server-side; never trust a total sent by the client.
    const quote = buildQuote(body);

    const order: Order = {
      id: newId('ord'),
      sessionId: body.sessionId,
      imageUrl: session.currentImageUrl,
      mediumId: body.mediumId,
      sizeId: body.sizeId,
      rushTierId: body.rushTierId,
      framed: body.framed,
      totalCents: quote.totalCents,
      customer: { name: body.name, email: body.email },
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
    };
    orders.set(order.id, order);

    const checkout = await payments.createCheckoutSession({
      orderId: order.id,
      amountCents: quote.totalCents,
      currency: 'usd',
      description: `Commissioned painting — order ${order.id}`,
      customerEmail: body.email,
      successUrl: `${WEB_ORIGIN}/studio/complete`,
      cancelUrl: `${WEB_ORIGIN}/studio`,
    });

    // A real processor confirms via webhook. The placeholder cannot, so mark it
    // paid inline to keep the demo flow walkable end to end.
    if (checkout.simulated) order.status = 'paid';

    res.json({ orderId: order.id, quote, checkout });
  } catch (err) {
    next(err);
  }
});

app.get('/api/orders/:orderId', (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.post('/api/webhooks/payment', express.raw({ type: '*/*' }), async (req, res) => {
  const result = await payments.handleWebhook(
    req.body?.toString?.() ?? '',
    req.header('x-signature'),
  );
  if (!result) return res.status(202).json({ ignored: true });

  const order = orders.get(result.orderId);
  if (order) order.status = result.status;
  res.json({ received: true });
});

// ---------------------------------------------------------------------------

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: 'Invalid request', issues: err.issues });
  }
  const status = (err as { status?: number })?.status ?? 500;
  const message = err instanceof Error ? err.message : 'Unexpected error';
  if (status >= 500) console.error('[api]', err);
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
