import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { api } from '../lib/api';
import type { GalleryPiece } from '../lib/types';
import { Seo } from '../components/Seo';
import { GalleryGrid } from '../components/GalleryGrid';
import { Reveal } from '../components/Reveal';

export function GalleryPage() {
  const [pieces, setPieces] = useState<GalleryPiece[]>([]);

  useEffect(() => {
    api.gallery().then((r) => setPieces(r.pieces)).catch(() => {});
  }, []);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: 'Eileen Studio Gallery',
    description: 'Recent commissioned paintings from the Eileen studio.',
    image: pieces.map((p) => p.url),
  };

  return (
    <>
      <Seo
        title="Gallery — Recent Commissions | Eileen"
        description="Browse recent hand-painted commissions in oil, acrylic, watercolour, charcoal and gold leaf, each designed conversationally by the customer who ordered it."
        path="/gallery"
        jsonLd={jsonLd}
      />

      <div className="mx-auto max-w-7xl px-6 pt-32 pb-24">
        <Reveal>
          <p className="text-[0.65rem] tracking-[0.3em] text-gilt uppercase">The gallery</p>
          <h1 className="mt-4 max-w-2xl font-display text-5xl leading-[1.02] text-balance text-ink sm:text-6xl">
            Every one of these started as a sentence.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
            A selection of recent commissions. Each was designed in conversation by the person who
            ordered it, then painted by hand in our studio.
          </p>
        </Reveal>

        <div className="mt-14">
          <GalleryGrid pieces={pieces} />
        </div>

        <Reveal className="mt-24 text-center">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">Yours next.</h2>
          <Link
            to="/studio"
            className="mt-8 inline-block rounded-full bg-gilt px-9 py-4 text-sm font-medium text-canvas transition-all duration-300 hover:bg-gilt-bright hover:shadow-[0_0_44px_-6px] hover:shadow-gilt/70"
          >
            Open the studio
          </Link>
        </Reveal>
      </div>
    </>
  );
}
