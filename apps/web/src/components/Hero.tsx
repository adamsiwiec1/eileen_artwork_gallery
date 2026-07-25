import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';

const SUGGESTIONS = [
  'My grandmother’s garden in late August, overgrown and full of bees',
  'A storm rolling over the harbour, seen from the kitchen window',
  'Our old dog asleep in a square of afternoon sun',
];

const FLOATERS = [
  { seed: 'eileen-h1', className: 'left-[4%] top-[16%] w-36 sm:w-44', depth: 26, delay: 0 },
  { seed: 'eileen-h2', className: 'right-[6%] top-[10%] w-32 sm:w-40', depth: -34, delay: 0.4 },
  { seed: 'eileen-h3', className: 'left-[10%] bottom-[12%] w-28 sm:w-36', depth: 40, delay: 0.8 },
  { seed: 'eileen-h4', className: 'right-[9%] bottom-[16%] w-36 sm:w-48', depth: -22, delay: 1.2 },
];

export function Hero() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const start = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 3) return;
    navigate(`/studio?prompt=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden pt-28 pb-20">
      {/* Warm gilt bloom behind the headline. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 size-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[120px]"
        style={{
          background:
            'radial-gradient(circle, rgba(200,164,104,0.20), rgba(184,101,79,0.10) 45%, transparent 70%)',
        }}
      />

      {FLOATERS.map((f) => (
        <motion.figure
          key={f.seed}
          aria-hidden
          className={`pointer-events-none absolute hidden overflow-hidden rounded-sm border border-white/[0.07] shadow-2xl shadow-black/60 lg:block ${f.className}`}
          initial={{ opacity: 0, y: 40, rotate: f.depth > 0 ? -4 : 4 }}
          animate={{
            opacity: 0.42,
            y: reduced ? 0 : [0, f.depth * 0.34, 0],
            rotate: f.depth > 0 ? -4 : 4,
          }}
          transition={{
            opacity: { duration: 1.4, delay: f.delay },
            y: { duration: 11 + f.delay * 2, repeat: Infinity, ease: 'easeInOut', delay: f.delay },
          }}
        >
          <img
            src={`https://picsum.photos/seed/${f.seed}/600/750`}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </motion.figure>
      ))}

      <div className="relative mx-auto w-full max-w-3xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-[0.65rem] tracking-[0.32em] text-gilt uppercase"
        >
          Commissioned originals · Hand-painted · Shipped worldwide
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
          className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-balance text-ink-muted"
        >
          Describe it in plain words. Refine it in conversation until it is exactly right. Then we
          hand-paint it in oil, watercolour or charcoal and ship it to your wall.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={(e) => {
            e.preventDefault();
            start(prompt);
          }}
          className="mx-auto mt-11 max-w-xl"
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

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
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
            ))}
          </div>
        </motion.form>
      </div>
    </section>
  );
}
