import { Link, useSearchParams } from 'react-router';
import { motion } from 'motion/react';

import { Seo } from '../components/Seo';

export function Complete() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const image = params.get('image');

  return (
    <>
      {/* Order confirmations must never be indexed. */}
      <Seo
        title="Commission Confirmed | Eileen"
        description="Your commission is confirmed and queued in the studio."
        path="/studio/complete"
      />
      <meta name="robots" content="noindex,nofollow" />

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
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto aspect-square w-56 rounded-sm border border-gilt/25 object-cover"
            />
          )}

          <p className="mt-10 text-[0.65rem] tracking-[0.3em] text-gilt uppercase">
            Commission confirmed
          </p>
          <h1 className="mt-5 font-display text-4xl leading-tight text-balance text-ink sm:text-5xl">
            It’s on the bench.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-muted">
            You’ll get an email when the underpainting is done, and again before it ships. Reply to
            it any time — a real person reads them.
          </p>

          {orderId && (
            <p className="mt-8 inline-block rounded-full border border-white/[0.08] px-4 py-2 font-mono text-xs text-ink-muted">
              {orderId}
            </p>
          )}

          <div className="mt-6 rounded-sm border border-rose/25 bg-rose/[0.06] px-5 py-3 text-sm text-ink-muted">
            Simulated checkout — no payment processor is connected and no card was charged.
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/studio"
              className="rounded-full bg-gilt px-7 py-3 text-sm font-medium text-canvas transition-all hover:bg-gilt-bright"
            >
              Design another
            </Link>
            <Link
              to="/gallery"
              className="rounded-full border border-white/[0.12] px-7 py-3 text-sm text-ink-muted transition-all hover:border-white/30 hover:text-ink"
            >
              Browse the gallery
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
