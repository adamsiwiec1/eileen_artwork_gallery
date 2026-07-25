import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import type { Testimonial } from '../lib/types';
import { BeforeAfter } from './BeforeAfter';
import { Reveal } from './Reveal';

const AUTOPLAY_MS = 7500;

function Stars({ count }: { count: number }) {
  return (
    <span className="text-sm tracking-[0.3em] text-gilt" aria-label={`${count} out of 5 stars`}>
      {'★'.repeat(count)}
    </span>
  );
}

export function Testimonials({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % items.length), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [index, paused, items.length]);

  if (!items.length) return null;
  const active = items[index]!;

  return (
    <section
      id="testimonials"
      className="relative border-y border-white/[0.06] bg-canvas-2 py-24 sm:py-32"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="text-[0.65rem] tracking-[0.3em] text-gilt uppercase">
            Concept, then canvas
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] text-balance text-ink sm:text-5xl">
            What they imagined, and what arrived.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
            Drag the handle to compare the AI concept our customers designed against the finished
            painting that shipped to them.
          </p>
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <Reveal>
            {/* Keyed remount so each slide's comparison resets its handle. */}
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <div className="absolute -inset-3 rounded-sm border border-gilt/15" aria-hidden />
                <BeforeAfter aiUrl={active.aiUrl} paintedUrl={active.paintedUrl} />
              </motion.div>
            </AnimatePresence>
          </Reveal>

          <div className="relative min-h-[22rem]">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={active.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
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

            <div className="mt-10 flex items-center gap-3">
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
    </section>
  );
}
