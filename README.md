# Eileen — AI-Designed, Hand-Painted Art Gallery

Customers describe a painting in plain language, refine it conversationally with
an image model, then commission it as a physical hand-painted piece — choosing
medium, size and how fast they need it.

## Stack

| Layer     | Choice                                                     |
| --------- | ---------------------------------------------------------- |
| Frontend  | Vite 8, React 19, React Router 8 (declarative), TypeScript |
| Styling   | Tailwind CSS v4 (CSS-first `@theme`, no config file)        |
| Animation | Motion 12 (`motion/react`, formerly Framer Motion)          |
| Backend   | Express 5, TypeScript, Zod                                  |
| Images    | Pollinations (free, no key) · Gemini · `gpt-image-1` · mock  |
| Chat      | Heuristic (no key) · Gemini · Groq · OpenAI                  |
| Payments  | Provider-agnostic adapter, currently simulated              |

Deploying? See [DEPLOYMENT.md](./DEPLOYMENT.md) — Cloudflare Pages for the
frontend, Render for the API, GitHub Actions for both.

## Running it

```bash
npm install
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000

Vite proxies `/api` to the Express server, so the browser only ever talks to one
origin and there is no CORS layer in development. This is also why sharing the
dev server over a tunnel like ngrok works with no extra configuration: requests
stay relative, and `localhost:4000` is resolved by Vite on your machine rather
than by the visitor's browser.

In production the two are on different hosts, so `VITE_API_URL` is compiled into
the bundle and requests become absolute. Leave it unset locally.

Other scripts: `npm run build`, `npm run typecheck`.

## Configuration

Everything runs with **zero configuration and no API keys** — including real AI
image generation. Copy `apps/api/.env.example` to `apps/api/.env` only to change
defaults.

### Cost, honestly

OpenAI has **no free tier for images**: `gpt-image-1` bills per image. So the
defaults avoid it entirely.

| Provider                       | Cost                        | Key      | True editing | Notes                                       |
| ------------------------------ | --------------------------- | -------- | ------------ | ------------------------------------------- |
| **Pollinations** *(default)*   | Free                        | None     | No           | ~1 request per 15s anonymously              |
| **Gemini** *(recommended)*     | Free tier, no card          | One key  | **Yes**      | Also serves the chat layer                  |
| OpenAI `gpt-image-1`           | ~$0.02–0.19 per image       | One key  | Yes          | Best quality                                |
| Mock                           | Free                        | None     | No           | Offline, no network                          |

Providers are auto-selected from whichever keys are present, or forced with
`IMAGE_PROVIDER` / `CHAT_PROVIDER`.

**Free and instant.** With no keys at all, images come from
[Pollinations](https://pollinations.ai) — no account, no card. Anonymous access
is limited to the `sana` model and has **no edit endpoint**, so refinements
re-render. To keep that coherent, the seed is fixed for the whole session while
the prompt evolves; holding a diffusion model's seed steady preserves
composition, so "warmer light, add a bench" adjusts the scene instead of
producing an unrelated painting. Rate limiting returns a clear 429 rather than a
generic failure.

**Free and better.** One key from [AI Studio](https://aistudio.google.com/apikey)
(no credit card) switches to `gemini-2.5-flash-image`, the only free option that
*genuinely edits*: the previous image is passed back as `inlineData`, so
composition survives a long back-and-forth. The same key powers the chat layer.
Note this model is slated for deprecation on 2 October 2026; the newer Nano
Banana Pro has no free tier.

**The chat layer.** An image model handles deltas badly — "warmer light" alone
discards the subject, and concatenating every instruction yields a contradictory
run-on prompt. So an LLM sits in front of it, rewriting the full brief into one
coherent prompt each turn and writing the assistant's reply. With no key this
degrades to plain concatenation. Any LLM failure falls back to that heuristic
automatically, because a rate-limited free tier is expected, not exceptional:
losing prompt rewriting is survivable, losing the generate button is not.

Generated images are returned as data URLs, which keeps each generation to a
single upstream request and freezes the bytes so an order cannot lose its
artwork if an upstream URL changes.

**Payments.** Deliberately undecided. `apps/api/src/paymentProvider.ts` defines a
`PaymentProvider` interface and a placeholder that returns a simulated redirect.
Adding Stripe or Square means writing one class and a `case` in
`createPaymentProvider` — no route or UI changes anywhere else.

## How pricing works

Prices are computed **server-side only**. The client fetches `/api/catalog` to
render options and calls `/api/quote` for totals, but `/api/checkout` always
recomputes from scratch, so a tampered client payload cannot change the charge.

Three inputs: medium (a price multiplier), size (a base price), and rush tier.

| Tier     | Lead time  | Surcharge         |
| -------- | ---------- | ----------------- |
| Standard | 14–30 days | included          |
| Priority | 7–10 days  | +22% and $45 flat |
| Express  | 3–5 days   | +48% and $95 flat |

Mediums shift that window. A rush tier is a **floor we commit to**, so a simpler
medium can only pull in the ceiling (charcoal on Standard quotes 14–26 days), it
can never promise delivery sooner than the tier. Complex work pushes both ends
out honestly — gold leaf on Express quotes 9–11 days, not 3–5. Every line on the
receipt shows that same computed window, so nothing advertises a date the studio
has not actually committed to.

## SEO approach

No SSR framework. React 19 hoists `<title>`, `<meta>` and `<link>` rendered
anywhere in the tree into `<head>` and dedupes them, so `components/Seo.tsx`
gives real per-route metadata with no Helmet and no server.

`index.html` also carries baseline tags for crawlers that never execute
JavaScript, plus `Organization` JSON-LD. Routes layer on their own structured
data: `Product` with `AggregateRating` and `Review` on the landing page (this is
what produces star ratings in search results), and `ImageGallery` on `/gallery`.
`robots.txt` and `sitemap.xml` ship in `public/`. Order confirmations are
`noindex`.

**Known gap.** Because this is a client-rendered SPA, crawlers that do not run
JavaScript — Facebook, Pinterest, LinkedIn, Slack, iMessage — see only the
`index.html` tags, so every URL yields the same link preview. Google renders JS
and is unaffected. If social sharing or Pinterest becomes a real acquisition
channel, add build-time prerendering (`vite-react-ssg` or Vike) for `/` and
`/gallery`; the `Seo` component already emits per-route tags, so prerendering
picks them up with no component changes.

## Layout

```
apps/
  api/src/
    index.ts            Express app and routes
    catalog.ts          Mediums, sizes, rush tiers, quote engine
    imageProvider.ts    Pollinations, Gemini, OpenAI, mock
    chatProvider.ts     Prompt rewriting + replies; Gemini, Groq, OpenAI
    paymentProvider.ts  PaymentProvider interface, placeholder
    testimonials.ts     Placeholder testimonial and gallery content
  web/src/
    routes/             Home, GalleryPage, Studio, Complete, NotFound
    components/         Layout, Hero, Process, Testimonials, BeforeAfter,
                        GalleryGrid, Configurator, Reveal, Seo
    lib/                api client, shared types
```

## Before this handles real traffic

- **Sessions and orders are in-memory** (`Map`s in `index.ts`) and vanish on
  restart. Move to Postgres or Redis.
- Wire a real payment provider and confirm orders from its **webhook**, not
  inline. The placeholder marks orders paid immediately to keep the demo
  walkable.
- Generated images are passed around as base64 data URLs, which is why the JSON
  body limit is 25 MB. Upload to object storage and pass URLs instead.
- Add rate limiting on `/api/studio/*`. On the free tiers this protects a shared
  upstream quota; on a paid key every call costs money.
- All imagery is Lorem Picsum placeholder content.
