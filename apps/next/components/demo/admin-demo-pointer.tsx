'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const FLAG = 'eileen-demo:admin';
const DISMISSED = 'eileen-demo:admin:dismissed';

/**
 * A tasteful, self-contained callout shown only on /admin* pages when the
 * visitor arrived from the /demo tour (?demo=1 or a persisted flag). Rendered
 * from the root layout so it needs no edits to the admin section.
 */
export function AdminDemoPointer() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!pathname || !pathname.startsWith('/admin')) {
      setShow(false);
      return;
    }
    let active = false;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === '1') {
        window.localStorage.setItem(FLAG, '1');
      }
      active =
        window.localStorage.getItem(FLAG) === '1' && window.localStorage.getItem(DISMISSED) !== '1';
    } catch {
      // ignore
    }
    setShow(active);
  }, [mounted, pathname]);

  if (!mounted || !show) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISSED, '1');
    } catch {
      // ignore
    }
    setShow(false);
  };

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 fixed right-4 bottom-4 z-[70] w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-card p-4 text-card-foreground shadow-2xl shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
          Studio back office
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="-mt-1 text-lg leading-none text-muted-foreground transition-colors hover:text-foreground"
        >
          ×
        </button>
      </div>
      <p className="mt-2 text-sm font-medium">This is where the work lands.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Orders, studio sessions and pricing live here. Sign in with the demo credentials shown on
        this screen to look around — your storefront keeps the palette you just chose.
      </p>
      <div className="mt-3">
        <a href="/demo" className="text-sm text-primary underline-offset-4 hover:underline">
          ← Back to the palette preview
        </a>
      </div>
    </div>
  );
}
