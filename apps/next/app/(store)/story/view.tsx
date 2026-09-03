'use client';

import Link from 'next/link';
import { EileenPhoto } from '@/components/store/EileenPhoto';
import { Reveal, RevealGroup, RevealItem } from '@/components/store/Reveal';
import { BlurFade } from '@/components/magicui/blur-fade';

type StoryFrame = { src: string; alt: string };

/**
 * Curated Instagram-story frames (8 of the original 10), kept in narrative order.
 * The desk/office selfie and the nude figure study were left out for a public,
 * tasteful gift site. Filenames match the shared public/eileen/story assets.
 */
const FRAMES: StoryFrame[] = [
  {
    src: 'story-2',
    alt: 'Eileen inside a black-and-white op-art light installation — she was always drawn to art, even when a teacher said she would find her way back to it.',
  },
  {
    src: 'story-4',
    alt: 'Eileen at her graduation between her two proud parents, after earning two master’s degrees.',
  },
  {
    src: 'story-5',
    alt: 'A close, smiling selfie beneath an ornate gilded gallery ceiling while travelling — soaking up art wherever she went.',
  },
  {
    src: 'story-6',
    alt: 'Eileen gazing up at art and architecture through tall windows framed by greenery; art has always grounded her.',
  },
  {
    src: 'story-8',
    alt: 'One of Eileen’s paintings — two hands entwined with a trailing vine — on the easel in her home studio.',
  },
  {
    src: 'story-9',
    alt: 'A matcha resting on Eileen’s paint-smeared palette, surrounded by well-used tubes of acrylic.',
  },
  {
    src: 'story-10',
    alt: 'Eileen with her arms thrown open in front of a colourful angel-wings mural — be brave, be bold.',
  },
];

function StoryImage({
  src,
  alt,
  className,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <picture>
      <source srcSet={`/eileen/story/${src}.webp`} type="image/webp" />
      <img
        src={`/eileen/story/${src}.jpg`}
        alt={alt}
        sizes={sizes}
        className={className}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
      />
    </picture>
  );
}

export function StoryView() {
  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-32 sm:pt-36">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <BlurFade>
            <p className="text-[0.65rem] tracking-[0.3em] text-gilt uppercase">
              My Story · Eileen Butler
            </p>
            <h1 className="mt-4 max-w-2xl font-display text-5xl leading-[1.02] text-balance text-ink sm:text-6xl">
              How I found my way back to painting.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted">
              I never planned to become an artist. About a year ago I started painting late at
              night — a small creative outlet after long days — and somewhere along the way it
              stopped being a hobby and became the thing I look forward to most. One canvas turned
              into a steady practice, and that practice turned into this little gallery.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
              This page is the honest version of how I got here — the long road, the detours, and
              the moment I finally decided to take it seriously.
            </p>
          </BlurFade>

          <Reveal>
            <figure className="relative mx-auto max-w-md overflow-hidden rounded-sm border border-white/[0.08] shadow-2xl shadow-black/40 lg:mx-0 lg:max-w-none">
              <StoryImage
                src="story-1"
                alt="Eileen Butler standing beside her large pink peony painting — the frame she titled ‘My Story as an Artist’."
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="w-full object-cover"
              />
            </figure>
          </Reveal>
        </div>
      </section>

      {/* The short version of me */}
      <section className="border-t border-white/[0.06] py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <figure className="mx-auto max-w-md overflow-hidden rounded-sm border border-white/[0.08] shadow-2xl shadow-black/40 lg:mx-0 lg:max-w-none">
              <EileenPhoto
                src="portrait"
                alt="A portrait of Eileen Butler"
                className="aspect-[4/5] w-full object-cover object-[center_20%]"
              />
            </figure>
          </Reveal>

          <Reveal className="order-1 lg:order-2">
            <p className="text-[0.65rem] tracking-[0.3em] text-gilt uppercase">The short version of me</p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] text-balance text-ink sm:text-5xl">
              Outgoing, outdoorsy, always mid-project.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted">
              I’m outgoing and endlessly curious, and I’m happiest outside — give me trees, water,
              and a bit of sun and I’m home. I’m ambitious and active by nature, always chasing the
              next thing to learn or try, and I genuinely love taking care of myself: the gym,
              movement, and a little daily discipline keep me grounded.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
              The best part of my life, though, is the people in it. I have two boys who keep me
              laughing — and, if I’m honest, a third: Adam, my partner, who puts up with paint on
              everything and cheers the loudest. They’re the reason behind most of what I make.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Before the easel */}
      <section className="border-t border-white/[0.06] py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            <p className="text-[0.65rem] tracking-[0.3em] text-gilt uppercase">Before the easel</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-balance text-ink sm:text-5xl">
              I spent years building things on screens.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-ink-muted">
              For about fifteen years I’ve worked in consumer tech as a product leader, living at
              the intersection of AI and behavioral science — obsessing over how technology can
              actually be good for the people using it. I started out in management consulting and
              data science at Beacon Consulting Group, and since then I’ve led product at companies
              like Dear Grace, Expectly, Babynest, Chompbox, and Vantage Residential.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Along the way I earned a master’s in Behavioral Science in London and a master’s in
              Data Science in the States — two very different ways of asking the same question: what
              makes people tick?
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              After all those years making things you tap and scroll, I found myself craving
              something I could make with my hands. Painting became that — a return to something
              slower and more human. This gallery is me sharing it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* My story, in pictures */}
      <section className="border-t border-white/[0.06] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="text-[0.65rem] tracking-[0.3em] text-gilt uppercase">My story, in pictures</p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] text-balance text-ink sm:text-5xl">
              A few frames from the journey.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
              From a high-school art teacher who saw it coming, to museums on every work trip, to
              the studio I paint in now — here’s the road in my own words.
            </p>
          </Reveal>

          <RevealGroup
            className="mt-12 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3"
            stagger={0.06}
          >
            {FRAMES.map((frame) => (
              <RevealItem key={frame.src}>
                <figure className="group relative overflow-hidden rounded-sm border border-white/[0.06] bg-canvas-3">
                  <StoryImage
                    src={frame.src}
                    alt={frame.alt}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                  <span className="pointer-events-none absolute inset-0 rounded-sm ring-1 ring-white/[0.06] ring-inset transition-all duration-500 group-hover:ring-gilt/30" />
                </figure>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Closing */}
      <section className="relative overflow-hidden border-t border-white/[0.06] py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[110px]"
          style={{
            background:
              'radial-gradient(circle, rgba(210,163,196,0.28), rgba(126,148,204,0.12) 55%, transparent 70%)',
          }}
        />
        <Reveal className="relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-4xl leading-[1.05] text-balance text-ink sm:text-5xl">
            Come see what’s on the easel.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-muted">
            Thank you for reading my story. The paintings are where it continues.
          </p>
          <Link
            href="/gallery"
            className="mt-10 inline-block rounded-full bg-gilt px-9 py-4 text-sm font-medium text-canvas transition-all duration-300 hover:bg-gilt-bright hover:shadow-[0_0_44px_-6px] hover:shadow-gilt/70"
          >
            View the gallery
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
