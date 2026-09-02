'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';

export function CompleteView() {
  const params = useSearchParams();
  const orderId = params.get('order');
  const image = params.get('image');

  return (
    <div className="mx-auto grid min-h-[80vh] max-w-2xl place-items-center px-6 py-32 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {image && (
          <motion.img
            src={image}
            alt="Your commissioned artwork"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto aspect-square w-56 rounded-sm border border-gilt/25 object-cover"
          />
        )}
        <p className="mt-10 text-[0.65rem] tracking-[0.3em] text-gilt uppercase">Commission confirmed</p>
        <h1 className="mt-5 font-display text-4xl leading-tight text-balance text-ink sm:text-5xl">
          It’s on the bench.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-muted">
          The studio will review your commission before a label is bought. You’ll get an email when
          Eileen accepts, and again before it ships.
        </p>
        {orderId && (
          <p className="mt-8 inline-block rounded-full border border-white/[0.08] px-4 py-2 font-mono text-xs text-ink-muted">
            {orderId}
          </p>
        )}
        <div className="mt-6 rounded-sm border border-rose/25 bg-rose/[0.06] px-5 py-3 text-sm text-ink-muted">
          Simulated checkout — no payment processor is connected and no postage has been purchased.
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/studio"
            className="rounded-full bg-gilt px-7 py-3 text-sm font-medium text-canvas hover:bg-gilt-bright"
          >
            Design another
          </Link>
          <Link
            href="/gallery"
            className="rounded-full border border-white/[0.12] px-7 py-3 text-sm text-ink-muted hover:text-ink"
          >
            Browse the gallery
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
