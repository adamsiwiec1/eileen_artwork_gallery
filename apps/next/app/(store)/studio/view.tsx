'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { api } from '@/lib/api';
import type { Catalog, CheckoutResult, StudioState } from '@/lib/types';
import { Configurator } from '@/components/store/Configurator';

type Stage = 'designing' | 'configuring';

function EaselPlaceholder({ busy }: { busy: boolean }) {
  return (
    <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-sm border border-white/[0.08] bg-canvas-2">
      {busy ? (
        <>
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, transparent 30%, rgba(200,164,104,0.16) 50%, transparent 70%)',
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="relative font-display text-lg text-ink-muted">Painting…</p>
        </>
      ) : (
        <p className="max-w-xs px-8 text-center text-sm leading-relaxed text-ink-muted/70">
          Your concept will appear here. Describe anything — a memory, a place, a feeling.
        </p>
      )}
    </div>
  );
}

export function StudioView() {
  const params = useSearchParams();
  const router = useRouter();
  const [studio, setStudio] = useState<StudioState | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [stage, setStage] = useState<Stage>('designing');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);

  useEffect(() => {
    api.catalog().then(setCatalog).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [studio?.turns.length, busy]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 3 || busy) return;
    setBusy(true);
    setError(null);
    setInput('');
    try {
      setStudio(studio ? await api.refine(studio.sessionId, trimmed) : await api.generate(trimmed));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const seed = params.get('prompt');
    if (!seed || seededRef.current) return;
    seededRef.current = true;
    void send(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onOrdered = (result: CheckoutResult) => {
    router.push(
      `/studio/complete?order=${result.orderId}&image=${encodeURIComponent(studio!.imageUrl)}`,
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pt-32 pb-24">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[0.65rem] tracking-[0.3em] text-gilt uppercase">The studio</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {stage === 'designing' ? 'Design your piece.' : 'Make it real.'}
          </h1>
        </div>
        {studio && (
          <div className="flex gap-2 rounded-full border border-white/[0.08] p-1">
            <button
              onClick={() => setStage('designing')}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                stage === 'designing' ? 'bg-gilt/15 text-gilt-bright' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Refine
            </button>
            <button
              onClick={() => setStage('configuring')}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                stage === 'configuring' ? 'bg-gilt/15 text-gilt-bright' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Medium &amp; size
            </button>
          </div>
        )}
      </header>

      <div className="mt-12">
        <AnimatePresence mode="wait">
          {stage === 'designing' ? (
            <motion.div
              key="designing"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="grid gap-8 lg:grid-cols-[1.15fr_1fr]"
            >
              <div className="lg:sticky lg:top-28 lg:self-start">
                <AnimatePresence mode="wait">
                  {studio && !busy ? (
                    <motion.figure
                      key={studio.imageUrl}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="relative"
                    >
                      <div className="absolute -inset-2 rounded-sm border border-gilt/20" aria-hidden />
                      <img
                        src={studio.imageUrl}
                        alt="Your generated concept"
                        className="aspect-square w-full rounded-sm object-cover"
                      />
                    </motion.figure>
                  ) : (
                    <motion.div key={busy ? 'busy' : 'empty'} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <EaselPlaceholder busy={busy} />
                    </motion.div>
                  )}
                </AnimatePresence>
                {studio && !busy && (
                  <button
                    onClick={() => setStage('configuring')}
                    className="mt-6 w-full rounded-full bg-gilt py-3.5 text-sm font-medium text-canvas transition-all duration-300 hover:bg-gilt-bright"
                  >
                    I love it — choose medium &amp; size
                  </button>
                )}
              </div>

              <div className="flex h-[34rem] flex-col rounded-sm border border-white/[0.08] bg-canvas-2/40">
                <div ref={scrollRef} className="scrollbar-slim flex-1 space-y-4 overflow-y-auto p-6">
                  {!studio && !busy && (
                    <div className="grid h-full place-items-center">
                      <p className="max-w-xs text-center text-sm leading-relaxed text-ink-muted/70">
                        Start with a sentence. You can change anything afterwards just by asking.
                      </p>
                    </div>
                  )}
                  {studio?.turns.map((turn, i) => (
                    <motion.div
                      key={`${turn.at}-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={turn.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                    >
                      <div
                        className={`max-w-[85%] rounded-sm px-4 py-3 text-sm leading-relaxed ${
                          turn.role === 'user'
                            ? 'bg-gilt/12 text-ink'
                            : 'border border-white/[0.06] bg-canvas text-ink-muted'
                        }`}
                      >
                        {turn.text}
                      </div>
                    </motion.div>
                  ))}
                  {busy && (
                    <div className="flex justify-start">
                      <div className="flex gap-1.5 rounded-sm border border-white/[0.06] bg-canvas px-4 py-4">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="size-1.5 rounded-full bg-gilt"
                            animate={{ opacity: [0.25, 1, 0.25] }}
                            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {error && <p className="border-t border-white/[0.06] px-6 py-3 text-sm text-rose">{error}</p>}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send(input);
                  }}
                  className="flex items-center gap-2 border-t border-white/[0.06] p-4"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={busy}
                    placeholder={studio ? 'Warmer light, fewer people…' : 'Describe your painting…'}
                    aria-label="Describe or refine your painting"
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={busy || input.trim().length < 3}
                    className="shrink-0 rounded-full border border-gilt/40 bg-gilt/10 px-5 py-2 text-sm text-gilt-bright hover:bg-gilt/20 disabled:opacity-30"
                  >
                    {studio ? 'Refine' : 'Generate'}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div key="configuring" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              {catalog && studio && (
                <Configurator
                  catalog={catalog}
                  sessionId={studio.sessionId}
                  imageUrl={studio.imageUrl}
                  onOrdered={onOrdered}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
