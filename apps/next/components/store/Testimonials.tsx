'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import type { Testimonial } from '@/lib/content';
import { BeforeAfter } from '@/components/store/BeforeAfter';
import { Reveal } from '@/components/store/Reveal';

const AUTOPLAY_MS = 7500;
/** Horizontal travel (px) required before a margin/quote swipe cycles slides. */
const SWIPE_THRESHOLD = 48;

/** Short subject phrases for accessible alt text, keyed by testimonial id. */
const SUBJECT_ALT: Record<string, string> = {
  peonies: 'a bouquet of overblown pink and cream peonies',
  bouquet: 'a bouquet of cream roses with pale blue wildflowers',
  woodland: 'a sunlit woodland path between tall trees',
  pear: 'a single ripe green pear',
};

/** Compact subject label for the counter and live-region announcements. */
const SUBJECT_LABEL: Record<string, string> = {
  peonies: 'Peonies',
  bouquet: 'Wedding bouquet',
  woodland: 'Woodland path',
  pear: 'Green pear',
};

function Stars({ count }: { count: number }) {
  return (
    <span className="text-sm tracking-[0.3em] text-gilt" aria-label={`${count} out of 5 stars`}>
      {'★'.repeat(count)}
    </span>
  );
}

/**
 * Prev/next control. Rendered as a sibling of the wipe (never a descendant),
 * so its pointer events can't reach BeforeAfter and can't nudge the reveal.
 */
function ArrowButton({
  dir,
  onActivate,
}: {
  dir: 'prev' | 'next';
  onActivate: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onActivate}
      aria-label={dir === 'prev' ? 'Show previous concept and painting' : 'Show next concept and painting'}
      className={`absolute top-1/2 z-30 grid size-11 min-h-11 min-w-11 -translate-y-1/2 place-items-center rounded-full border border-gilt/40 bg-canvas/70 text-gilt-bright backdrop-blur-md transition-[transform,background-color,border-color] duration-200 hover:border-gilt/70 hover:bg-canvas/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-gilt focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-2 active:scale-95 ${
        dir === 'prev' ? 'left-2 sm:left-3' : 'right-2 sm:right-3'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`size-5 ${dir === 'next' ? 'rotate-180' : ''}`}
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  );
}

export function Testimonials({ items }: { items: Testimonial[] }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [holding, setHolding] = useState(false);

  // Start coordinates for a potential cycle-swipe; `active` is false whenever
  // the gesture began on the wipe/controls or turned out to be a vertical scroll.
  const swipe = useRef({ x: 0, y: 0, active: false });

  const total = items.length;
  const go = (dir: number) => setIndex((i) => (i + dir + total) % total);

  // Autoplay yields to hover, active presses (incl. an in-progress wipe drag),
  // and reduced-motion preferences so it never fights a manual interaction.
  useEffect(() => {
    if (reduced || hovering || holding || total <= 1) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % total), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [index, hovering, holding, reduced, total]);

  if (!total) return null;
  const active = items[index]!;
  const subject = SUBJECT_ALT[active.id];
  const label = SUBJECT_LABEL[active.id] ?? active.customer;

  const slideTransition = reduced
    ? { duration: 0.2, ease: 'linear' as const }
    : { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // The wipe handle also listens for arrows and calls preventDefault; if it
    // already consumed the key, don't also cycle the carousel.
    if (e.defaultPrevented) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) {
      swipe.current.active = false;
      return;
    }
    // A cycle-swipe may only begin OUTSIDE the wipe and the controls, so a
    // reveal drag (or a button tap) can never be read as a slide change.
    const target = e.target as HTMLElement;
    if (target.closest('[data-carousel-wipe], button, a, [role="slider"]')) {
      swipe.current.active = false;
      return;
    }
    const t = e.touches[0]!;
    swipe.current = { x: t.clientX, y: t.clientY, active: true };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swipe.current.active || e.touches.length !== 1) return;
    const t = e.touches[0]!;
    const dx = t.clientX - swipe.current.x;
    const dy = t.clientY - swipe.current.y;
    // Clear vertical intent → treat as a page scroll, not a cycle.
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 24) {
      swipe.current.active = false;
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!swipe.current.active) return;
    swipe.current.active = false;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - swipe.current.x;
    const dy = t.clientY - swipe.current.y;
    // Require a decisive, mostly-horizontal travel before cycling.
    if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.4) {
      go(dx < 0 ? 1 : -1);
    }
  };

  return (
    <section
      id="testimonials"
      className="relative border-y border-white/[0.06] bg-canvas-2 py-24 sm:py-32"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="text-[0.65rem] tracking-[0.3em] text-gilt uppercase">
            Concept, then canvas
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] text-balance text-ink sm:text-5xl">
            What the muse dreamed, and what she painted.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
            Drag the handle to compare the concept the studio dreamed up against the painting
            Eileen finished by hand. Use the arrows to move between subjects.
          </p>
        </Reveal>

        {/* Carousel region: pointer state pauses autoplay; touch handlers power
            the margin/quote swipe; arrow keys cycle when the wipe isn't focused. */}
        <div
          role="group"
          aria-roledescription="carousel"
          aria-label="Concept-to-canvas comparisons"
          className="mt-14 grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16"
          onPointerDown={() => setHolding(true)}
          onPointerUp={() => setHolding(false)}
          onPointerCancel={() => setHolding(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onKeyDown={onKeyDown}
        >
          <p className="sr-only" aria-live="polite">
            {`Item ${index + 1} of ${total}: ${label}`}
          </p>

          <Reveal>
            {/* Stable frame keeps the arrows mounted/positioned while the wipe
                inside crossfades between subjects. */}
            <div className="relative aspect-4/5 w-full">
              <div className="absolute -inset-3 rounded-sm border border-gilt/15" aria-hidden />
              {/* Keyed remount so each slide's comparison resets its handle. */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, scale: reduced ? 1 : 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: reduced ? 1 : 0.985 }}
                  transition={slideTransition}
                  className="absolute inset-0"
                >
                  <div data-carousel-wipe className="h-full w-full">
                    <BeforeAfter
                      aiUrl={active.aiUrl}
                      paintedUrl={active.paintedUrl}
                      paintedAlt={
                        subject
                          ? `Finished hand-painted ${subject}, an original by Eileen Butler`
                          : undefined
                      }
                      aiAlt={
                        subject
                          ? `AI concept of ${subject}, generated in Eileen Butler’s painting style`
                          : undefined
                      }
                    />
                  </div>
                </motion.div>
              </AnimatePresence>

              <ArrowButton dir="prev" onActivate={() => go(-1)} />
              <ArrowButton dir="next" onActivate={() => go(1)} />
            </div>
          </Reveal>

          <div className="relative min-h-[22rem]">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={active.id}
                initial={{ opacity: 0, y: reduced ? 0 : 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : -18 }}
                transition={reduced ? { duration: 0.2, ease: 'linear' } : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <Stars count={active.rating} />
                <p className="mt-6 font-display text-2xl leading-[1.35] text-balance text-ink sm:text-[1.75rem]">
                  “{active.quote}”
                </p>

                <footer className="mt-8">
                  <p className="text-sm text-ink">{active.customer}</p>
                  <p className="text-sm text-ink-muted">{active.location}</p>

                  <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-white/[0.08] pt-6 text-xs">
                    <div>
                      <dt className="tracking-[0.16em] text-ink-muted/60 uppercase">Medium</dt>
                      <dd className="mt-1.5 text-ink">{active.medium}</dd>
                    </div>
                    <div>
                      <dt className="tracking-[0.16em] text-ink-muted/60 uppercase">Size</dt>
                      <dd className="mt-1.5 text-ink">{active.size}</dd>
                    </div>
                    <div>
                      <dt className="tracking-[0.16em] text-ink-muted/60 uppercase">Timing</dt>
                      <dd className="mt-1.5 text-ink">{active.rushTier}</dd>
                    </div>
                  </dl>
                </footer>
              </motion.blockquote>
            </AnimatePresence>

            <div className="mt-10 flex items-center gap-4">
              <span className="shrink-0 text-xs tracking-[0.2em] text-ink-muted tabular-nums">
                <span className="text-gilt-bright">{String(index + 1).padStart(2, '0')}</span>
                <span className="mx-1 text-ink-muted/40">/</span>
                {String(total).padStart(2, '0')}
              </span>
              <div className="flex flex-1 items-center gap-3">
                {items.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => setIndex(i)}
                    aria-label={`Show testimonial from ${item.customer}`}
                    aria-current={i === index}
                    className="group relative h-1 flex-1 overflow-hidden rounded-full bg-white/10"
                  >
                    <span
                      className={`absolute inset-0 origin-left bg-gilt transition-transform duration-500 ${
                        i === index ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
