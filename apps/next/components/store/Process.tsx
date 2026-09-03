'use client';

import { Reveal, RevealGroup, RevealItem } from '@/components/store/Reveal';

const STEPS = [
  {
    n: '01',
    title: 'Describe it',
    body: 'A sentence is enough — “my grandmother’s garden in August.” An AI shaped on Eileen’s own work answers with a first concept in her style.',
  },
  {
    n: '02',
    title: 'Talk it through',
    body: 'Warmer light. Fewer people. Move the tree left. Keep refining in plain language until the concept is genuinely yours.',
  },
  {
    n: '03',
    title: 'Choose the object',
    body: 'Oil, acrylic, watercolour, charcoal or gold leaf. Four sizes, framed or bare. The price updates as you go.',
  },
  {
    n: '04',
    title: 'Have her paint it',
    body: 'Love it enough to own it? Eileen paints your concept by hand. Standard is 14–30 days; jump the queue if you’re on a deadline.',
  },
];

export function Process() {
  return (
    <section id="process" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="text-[0.65rem] tracking-[0.3em] text-gilt uppercase">The process</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] text-balance text-ink sm:text-5xl">
            Four steps from a sentence to something on your wall.
          </h2>
        </Reveal>

        <RevealGroup className="mt-16 grid gap-px overflow-hidden rounded-sm bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <RevealItem key={step.n} className="group relative bg-canvas p-8 transition-colors duration-500 hover:bg-canvas-2">
              <span className="font-display text-5xl font-light text-white/[0.07] transition-colors duration-500 group-hover:text-gilt/25">
                {step.n}
              </span>
              <h3 className="mt-5 font-display text-xl text-ink">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{step.body}</p>
              <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gilt transition-transform duration-500 group-hover:scale-x-100" />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
