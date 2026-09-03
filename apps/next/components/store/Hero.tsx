'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { EileenPhoto } from '@/components/store/EileenPhoto';

const SUGGESTIONS = [
  'My grandmother’s garden in late August, overgrown and full of bees',
  'The motorcycle that carried you home, still warm in the driveway',
  'My first car in the rain, chrome catching the streetlight',
];

export function Hero() {
  const [prompt, setPrompt] = useState('');
  const router = useRouter();
  const reduced = useReducedMotion();

  const start = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 3) return;
    router.push(`/studio?prompt=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden pt-28 pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 size-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[120px]"
        style={{
          background:
            'radial-gradient(circle at 38% 42%, rgba(196,93,122,0.22), transparent 44%), radial-gradient(circle at 62% 56%, rgba(210,163,196,0.20), transparent 48%), radial-gradient(circle at 50% 50%, rgba(126,148,204,0.16), transparent 64%)',
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.15fr)] lg:gap-16">
        <motion.figure
          initial={{ opacity: 0, y: reduced ? 0 : 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="order-2 mx-auto w-full max-w-[13.5rem] overflow-hidden rounded-sm border border-white/[0.08] shadow-2xl shadow-black/50 sm:max-w-xs lg:order-1 lg:max-w-none"
        >
          <EileenPhoto
            src="portrait"
            alt="Eileen Butler in her studio"
            className="aspect-[4/5] w-full object-cover object-[center_18%]"
            priority
          />
        </motion.figure>

        <div className="order-1 text-center lg:order-2 lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-[0.65rem] tracking-[0.32em] text-gilt uppercase"
          >
            Eileen Butler · East Coast originals
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 font-display text-5xl leading-[0.98] font-light tracking-tight text-balance text-ink sm:text-6xl md:text-7xl"
          >
            The painting you
            <span className="block italic text-gilt-bright">already see</span>
            in your head.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-balance text-ink-muted lg:mx-0"
          >
            Tell Eileen Butler what you already see. She likes making paintings for people — that is
            why they like hers. A garden, a harbour, the motorcycle or car you cannot stop looking at.
            Then she paints it by hand and sends it home.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
            onSubmit={(e) => {
              e.preventDefault();
              start(prompt);
            }}
            className="mx-auto mt-11 max-w-xl lg:mx-0"
          >
            <div className="group relative flex items-center gap-2 rounded-full border border-white/12 bg-canvas-2/70 p-2 backdrop-blur-xl transition-colors focus-within:border-gilt/50">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your painting…"
                aria-label="Describe the painting you want"
                className="min-w-0 flex-1 bg-transparent px-5 py-3 text-base text-ink placeholder:text-ink-muted/50 focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-gilt px-6 py-3 text-sm font-medium text-canvas transition-all duration-300 hover:bg-gilt-bright hover:shadow-[0_0_34px_-4px] hover:shadow-gilt/60"
              >
                Begin
              </button>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
              {SUGGESTIONS.map((s) => {
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setPrompt(s);
                      start(s);
                    }}
                    className="max-w-full truncate rounded-full border border-white/8 px-3.5 py-1.5 text-xs text-ink-muted transition-all hover:border-gilt/40 hover:text-ink"
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
