'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { GalleryPiece, Testimonial } from '@/lib/content';
import type { RushTier } from '@/lib/types';
import { Hero } from '@/components/store/Hero';
import { Process } from '@/components/store/Process';
import { Testimonials } from '@/components/store/Testimonials';
import { GalleryGrid } from '@/components/store/GalleryGrid';
import { Reveal, RevealGroup, RevealItem } from '@/components/store/Reveal';
import { BlurFade } from '@/components/magicui/blur-fade';
import { Marquee } from '@/components/magicui/marquee';

function LeadTimes({ tiers }: { tiers: RushTier[] }) {
  return (
    <section className="border-t border-white/[0.06] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="text-[0.65rem] tracking-[0.3em] text-gilt uppercase">Lead times</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] text-balance text-ink sm:text-5xl">
            On a deadline? Move to the front of the bench.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
            Every commission is painted by hand, so timing is a real constraint rather than a
            shipping option. Pay to reprioritise the studio queue.
          </p>
        </Reveal>
        <RevealGroup className="mt-14 grid gap-4 md:grid-cols-3">
          {tiers.map((tier, i) => (
            <RevealItem key={tier.id}>
              <div
                className={`group relative h-full overflow-hidden rounded-sm border p-8 transition-all duration-500 ${
                  i === 1
                    ? 'border-gilt/40 bg-gilt/[0.05] hover:border-gilt/70'
                    : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                {i === 1 && (
                  <span className="absolute top-5 right-5 rounded-full bg-gilt/15 px-2.5 py-1 text-[0.6rem] tracking-[0.16em] text-gilt-bright uppercase">
                    Most chosen
                  </span>
                )}
                <p className="text-[0.65rem] tracking-[0.24em] text-ink-muted uppercase">{tier.name}</p>
                <p className="mt-4 font-display text-4xl text-ink">{tier.leadTime}</p>
                <p className="mt-5 text-sm leading-relaxed text-ink-muted">{tier.description}</p>
                <p className="mt-8 border-t border-white/[0.08] pt-5 text-sm text-gilt">
                  {tier.surchargePct === 0 && tier.flatFeeCents === 0
                    ? 'Included'
                    : `+${Math.round(tier.surchargePct * 100)}% · +$${tier.flatFeeCents / 100} handling`}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pieces, setPieces] = useState<GalleryPiece[]>([]);
  const [tiers, setTiers] = useState<RushTier[]>([]);

  useEffect(() => {
    api.testimonials().then((r) => setTestimonials(r.testimonials)).catch(() => {});
    api.gallery().then((r) => setPieces(r.pieces.slice(0, 6))).catch(() => {});
    api.catalog().then((c) => setTiers(c.rushTiers)).catch(() => {});
  }, []);

  return (
    <>
      <Hero />
      <BlurFade>
        <Marquee className="border-y border-white/[0.05] bg-canvas-2/40 py-3 text-[0.65rem] tracking-[0.28em] text-ink-muted uppercase">
          {['Oil', 'Watercolour', 'Charcoal', 'Gold leaf', 'Hand-painted', 'One of one'].map((word) => (
            <span key={word}>{word}</span>
          ))}
        </Marquee>
      </BlurFade>
      <Process />
      <Testimonials items={testimonials} />
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[0.65rem] tracking-[0.3em] text-gilt uppercase">Recently painted</p>
                <h2 className="mt-4 font-display text-4xl leading-[1.05] text-ink sm:text-5xl">
                  From the studio.
                </h2>
              </div>
              <Link
                href="/gallery"
                className="group inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-gilt"
              >
                See the full gallery
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </Reveal>
          <div className="mt-12">
            <GalleryGrid pieces={pieces} />
          </div>
        </div>
      </section>
      <LeadTimes tiers={tiers} />
      <section className="relative overflow-hidden border-t border-white/[0.06] py-28">
        <Reveal className="relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-4xl leading-[1.05] text-balance text-ink sm:text-5xl">
            It takes one sentence to start.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-muted">
            No account, no card. Design the piece first and decide about it afterwards.
          </p>
          <Link
            href="/studio"
            className="mt-10 inline-block rounded-full bg-gilt px-9 py-4 text-sm font-medium text-canvas transition-all duration-300 hover:bg-gilt-bright hover:shadow-[0_0_44px_-6px] hover:shadow-gilt/70"
          >
            Open the studio
          </Link>
        </Reveal>
      </section>
    </>
  );
}
