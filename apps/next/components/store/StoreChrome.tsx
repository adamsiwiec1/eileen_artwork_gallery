'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useSpring } from 'motion/react';
import { ErrorBoundary } from '@/components/store/ErrorBoundary';

function ProgressRule() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      className="gilt-rule fixed inset-x-0 top-0 z-50 h-px origin-left"
      style={{ scaleX: width }}
    />
  );
}

const links = [
  { to: '/', label: 'Home' },
  { to: '/gallery', label: 'Gallery' },
];

function Header() {
  const [lifted, setLifted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        lifted
          ? 'border-b border-white/[0.06] bg-canvas/80 py-3 backdrop-blur-xl'
          : 'border-b border-transparent py-6'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl font-medium tracking-tight text-ink">Eileen</span>
          <span className="hidden text-[0.65rem] tracking-[0.28em] text-ink-muted uppercase transition-colors group-hover:text-gilt sm:block">
            Atelier
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const isActive = pathname === link.to;
            return (
              <Link
                key={link.to}
                href={link.to}
                className={`relative px-3 py-2 text-sm transition-colors ${
                  isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-0.5 h-px bg-gilt"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          <Link
            href="/studio"
            className="ml-2 rounded-full border border-gilt/40 bg-gilt/10 px-4 py-2 text-sm text-gilt-bright transition-all duration-300 hover:border-gilt hover:bg-gilt/20 hover:shadow-[0_0_28px_-6px] hover:shadow-gilt/50 sm:px-5"
          >
            Start a piece
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-canvas-2">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <p className="font-display text-2xl text-ink">Eileen</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
            Commissioned originals, designed in conversation and painted by hand in our studio.
            Every piece is one of one.
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] tracking-[0.24em] text-gilt uppercase">Explore</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
            <li>
              <Link href="/gallery" className="transition-colors hover:text-ink">
                Gallery
              </Link>
            </li>
            <li>
              <Link href="/studio" className="transition-colors hover:text-ink">
                The Studio
              </Link>
            </li>
            <li>
              <a href="/#testimonials" className="transition-colors hover:text-ink">
                Testimonials
              </a>
            </li>
            <li>
              <a href="/#process" className="transition-colors hover:text-ink">
                How it works
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[0.65rem] tracking-[0.24em] text-gilt uppercase">Studio</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
            <li>Standard — 14–30 days</li>
            <li>Priority — 7–10 days</li>
            <li>Express — 3–5 days</li>
            <li className="pt-1 text-ink-muted/60">Ships worldwide</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.04] px-6 py-6">
        <p className="mx-auto max-w-7xl text-xs text-ink-muted/60">
          © {new Date().getFullYear()} Eileen Atelier. Placeholder imagery throughout.
        </p>
      </div>
    </footer>
  );
}

export function StoreChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="bg-weave min-h-screen">
      <ProgressRule />
      <Header />
      <main>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
