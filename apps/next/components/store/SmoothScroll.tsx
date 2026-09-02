'use client';

import { useEffect } from 'react';

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let killed = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (killed) return;

      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({
        duration: 1.1,
        smoothWheel: true,
      });

      const onTick = (time: number) => {
        lenis.raf(time * 1000);
      };
      gsap.ticker.add(onTick);
      gsap.ticker.lagSmoothing(0);
      lenis.on('scroll', ScrollTrigger.update);

      cleanup = () => {
        gsap.ticker.remove(onTick);
        lenis.destroy();
      };
    })();

    return () => {
      killed = true;
      cleanup?.();
    };
  }, []);

  return null;
}
