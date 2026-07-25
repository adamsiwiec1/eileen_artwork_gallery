import { motion } from 'motion/react';

import type { GalleryPiece } from '../lib/types';
import { RevealGroup, RevealItem } from './Reveal';

const SPAN_CLASS: Record<GalleryPiece['span'], string> = {
  tall: 'sm:row-span-2 aspect-2/3',
  wide: 'sm:col-span-2 aspect-3/2',
  square: 'aspect-square',
};

export function GalleryGrid({ pieces }: { pieces: GalleryPiece[] }) {
  return (
    <RevealGroup
      className="grid auto-rows-auto grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      stagger={0.06}
    >
      {pieces.map((piece) => (
        <RevealItem key={piece.id} className={SPAN_CLASS[piece.span]}>
          <motion.figure
            whileHover="hover"
            initial="rest"
            className="group relative h-full w-full overflow-hidden rounded-sm bg-canvas-3"
          >
            <motion.img
              src={piece.url}
              alt={`${piece.title} — ${piece.medium}, ${piece.size}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              variants={{ rest: { scale: 1 }, hover: { scale: 1.05 } }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />

            <motion.figcaption
              variants={{ rest: { opacity: 0, y: 12 }, hover: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-canvas via-canvas/85 to-transparent p-5 pt-14"
            >
              <p className="font-display text-lg text-ink">{piece.title}</p>
              <p className="mt-1 text-xs tracking-wide text-ink-muted">
                {piece.medium} · {piece.size}
              </p>
            </motion.figcaption>

            <span className="pointer-events-none absolute inset-0 rounded-sm ring-1 ring-white/[0.06] ring-inset transition-all duration-500 group-hover:ring-gilt/30" />
          </motion.figure>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
