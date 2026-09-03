'use client';

import Link from 'next/link';
import { PalettePicker } from '@/components/theme/palette-picker';
import { GuidedTour, START_TOUR_EVENT, type TourStep } from '@/components/demo/guided-tour';
import { BeforeAfter } from '@/components/store/BeforeAfter';
import { EileenPhoto } from '@/components/store/EileenPhoto';
import { useTheme } from '@/components/theme/theme-provider';
import { THEMES } from '@/components/theme/theme-config';

const TOUR: TourStep[] = [
  {
    anchorId: 'demo-palette',
    title: 'Pick a palette',
    body: 'Tap any palette and the whole studio — this page and your live site — recolours instantly. Your choice is remembered.',
  },
  {
    anchorId: 'demo-preview',
    title: 'Your real storefront',
    body: 'These are your actual photos, buttons and the before/after slider. Drag the divider to compare the AI concept with the finished painting.',
  },
  {
    anchorId: 'demo-admin',
    title: 'Step behind the counter',
    body: 'When you are ready, head into the studio back office to see where orders and sessions arrive — your palette follows you there.',
  },
];

function rememberAdminDemo() {
  try {
    window.localStorage.setItem('eileen-demo:admin', '1');
  } catch {
    // ignore
  }
}

export default function DemoPage() {
  const { theme, mounted } = useTheme();
  const current = (mounted && THEMES.find((t) => t.id === theme)) || THEMES[0];

  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-24 sm:pt-32">
      <header className="max-w-2xl">
        <p className="text-[0.65rem] tracking-[0.32em] text-gilt uppercase">A guided preview for Eileen</p>
        <h1 className="mt-5 font-display text-4xl leading-[1.02] font-light tracking-tight text-balance text-ink sm:text-6xl">
          Choose the mood of your gallery.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-balance text-ink-muted">
          Pick a colour scheme and watch your real site — photos, buttons and all — change with it.
          When a palette feels right, it stays with you across every page.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(START_TOUR_EVENT))}
            className="rounded-full bg-gilt px-6 py-3 text-sm font-medium text-canvas transition-all duration-300 hover:bg-gilt-bright hover:shadow-[0_0_34px_-6px] hover:shadow-gilt/60"
          >
            Take the guided tour
          </button>
          <Link
            href="/"
            className="rounded-full border border-white/12 px-6 py-3 text-sm text-ink transition-colors hover:border-gilt/50"
          >
            View the live homepage
          </Link>
        </div>
      </header>

      {/* 1 — palette picker */}
      <section id="demo-palette" className="mt-16 scroll-mt-28">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-ink">Palettes</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Currently showing <span className="text-gilt-bright">{current.name}</span> —{' '}
              {current.tagline.toLowerCase()}.
            </p>
          </div>
        </div>
        <PalettePicker className="mt-6" />
      </section>

      {/* 2 — live preview built from the real site pieces */}
      <section id="demo-preview" className="mt-16 scroll-mt-28">
        <h2 className="font-display text-2xl text-ink">Live preview</h2>
        <p className="mt-1 text-sm text-ink-muted">Real pieces from your site, recoloured in real time.</p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-canvas-2/40">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg text-ink">Eileen Butler</span>
              <span className="hidden text-[0.6rem] tracking-[0.28em] text-ink-muted uppercase sm:block">
                Atelier
              </span>
            </div>
            <span className="rounded-full border border-gilt/40 bg-gilt/10 px-4 py-1.5 text-xs text-gilt-bright">
              Start a piece
            </span>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[0.8fr_1.1fr] md:gap-8 md:p-8">
            <figure className="mx-auto w-full max-w-[12rem] overflow-hidden rounded-sm border border-white/[0.08] shadow-2xl shadow-black/50 md:max-w-none">
              <EileenPhoto
                src="portrait"
                alt="Eileen Butler in her studio"
                className="aspect-[4/5] w-full object-cover object-[center_18%]"
              />
            </figure>
            <div className="flex flex-col justify-center">
              <p className="text-[0.6rem] tracking-[0.3em] text-gilt uppercase">East Coast originals</p>
              <p className="mt-3 font-display text-3xl leading-[1.02] text-balance text-ink sm:text-4xl">
                The painting <span className="text-gilt-bright italic">she’d imagine</span> for you.
              </p>
              <div className="mt-6 flex items-center gap-2 rounded-full border border-white/12 bg-canvas/60 p-1.5">
                <span className="flex-1 truncate px-4 py-2 text-sm text-ink-muted/70">
                  Describe your painting…
                </span>
                <span className="rounded-full bg-gilt px-5 py-2 text-sm font-medium text-canvas">Begin</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/studio"
                  className="rounded-full bg-gilt px-5 py-2.5 text-sm font-medium text-canvas transition-all duration-300 hover:bg-gilt-bright"
                >
                  Commission a piece
                </Link>
                <Link
                  href="/studio"
                  className="rounded-full border border-gilt/40 bg-gilt/10 px-5 py-2.5 text-sm text-gilt-bright transition-all duration-300 hover:bg-gilt/20"
                >
                  Refine a concept
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-6 border-t border-white/[0.06] p-6 md:grid-cols-2 md:p-8">
            <figure>
              <figcaption className="mb-3 text-[0.6rem] tracking-[0.2em] text-ink-muted uppercase">
                Drag to compare — concept vs. painted
              </figcaption>
              <BeforeAfter
                aiUrl="/eileen/beforeafter/before-bouquet.jpg"
                paintedUrl="/eileen/beforeafter/after-bouquet.jpg"
              />
            </figure>
            <div className="grid grid-cols-2 gap-4 self-start">
              {[
                { src: 'studio' as const, title: 'In the studio' },
                { src: 'with-work' as const, title: 'Signed EB' },
              ].map((g) => (
                <figure key={g.src} className="overflow-hidden rounded-sm border border-white/[0.08]">
                  <EileenPhoto src={g.src} alt={g.title} className="aspect-[4/5] w-full object-cover" />
                  <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-ink-muted">
                    <span className="truncate">{g.title}</span>
                    <span className="text-gilt">EB</span>
                  </figcaption>
                </figure>
              ))}
              <div className="col-span-2 rounded-sm border border-white/[0.06] bg-canvas/40 p-4">
                <div className="gilt-rule h-px w-16" />
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  “It arrived with her exact light in it — that soft Carolina gold. The first thing
                  anyone looks at when they walk in.”
                </p>
                <p className="mt-2 text-xs text-gilt">Marguerite D. · Charleston, SC</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 — hand-off to the admin side */}
      <section id="demo-admin" className="mt-16 scroll-mt-28">
        <div className="relative overflow-hidden rounded-2xl border border-gilt/25 bg-canvas-2/60 p-8 sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-16 size-64 rounded-full opacity-40 blur-[90px]"
            style={{ background: 'radial-gradient(circle, var(--gilt), transparent 65%)' }}
          />
          <div className="relative max-w-xl">
            <p className="text-[0.6rem] tracking-[0.3em] text-gilt uppercase">The other side</p>
            <h2 className="mt-4 font-display text-3xl leading-[1.05] text-balance text-ink sm:text-4xl">
              See where the work lands.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Every concept your visitors design and every order they place shows up in your studio
              console. Take a peek — your chosen palette comes with you.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/admin?demo=1"
                onClick={rememberAdminDemo}
                className="rounded-full bg-gilt px-7 py-3.5 text-sm font-medium text-canvas transition-all duration-300 hover:bg-gilt-bright hover:shadow-[0_0_40px_-8px] hover:shadow-gilt/60"
              >
                See the studio back office →
              </Link>
              <Link
                href="/gallery"
                className="rounded-full border border-white/12 px-7 py-3.5 text-sm text-ink transition-colors hover:border-gilt/50"
              >
                Browse the gallery first
              </Link>
            </div>
          </div>
        </div>
      </section>

      <GuidedTour steps={TOUR} storageId="eileen-demo-v1" />
    </div>
  );
}
