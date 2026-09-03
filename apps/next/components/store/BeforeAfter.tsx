'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  aiUrl: string;
  paintedUrl: string;
  /** Alt text for the finished painting layer. */
  paintedAlt?: string;
  /** Alt text for the AI concept layer. */
  aiAlt?: string;
  /** Starting reveal position, 0–100. */
  initial?: number;
};

/** Swap a local `.jpg` asset for its `.webp` sibling; `undefined` for remote/other. */
function webpSibling(url: string): string | undefined {
  return url.startsWith('/') && url.endsWith('.jpg') ? url.replace(/\.jpg$/, '.webp') : undefined;
}

function clampReveal(value: number) {
  return Math.min(100, Math.max(0, value));
}

/**
 * Drag-to-compare between the AI concept and the finished painting.
 *
 * Position is a CSS variable painted in rAF (no React re-render per move).
 * The handle rides a full-width track via translate3d so we never set `left`
 * or width during a drag — those force layout on every frame.
 */
export function BeforeAfter({
  aiUrl,
  paintedUrl,
  paintedAlt = 'The finished hand-painted commission',
  aiAlt = 'The AI-generated concept the customer designed',
  initial = 55,
}: Props) {
  const paintedWebp = webpSibling(paintedUrl);
  const aiWebp = webpSibling(aiUrl);
  const frameRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef(initial);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingXRef = useRef<number | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const lockedRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [announced, setAnnounced] = useState(initial);

  const paintReveal = useCallback((pct: number) => {
    revealRef.current = pct;
    frameRef.current?.style.setProperty('--reveal', `${pct}%`);
  }, []);

  const flushPending = useCallback(() => {
    rafRef.current = null;
    const clientX = pendingXRef.current;
    const rect = rectRef.current;
    if (clientX == null || !rect || rect.width === 0) return;
    paintReveal(clampReveal(((clientX - rect.left) / rect.width) * 100));
  }, [paintReveal]);

  const queueFromClientX = useCallback(
    (clientX: number) => {
      pendingXRef.current = clientX;
      if (rafRef.current == null) {
        rafRef.current = window.requestAnimationFrame(flushPending);
      }
    },
    [flushPending],
  );

  const measure = useCallback(() => {
    rectRef.current = frameRef.current?.getBoundingClientRect() ?? null;
  }, []);

  const finishDrag = useCallback(
    (node: HTMLDivElement, pointerId: number) => {
      if (pointerIdRef.current !== pointerId) return;
      pointerIdRef.current = null;
      originRef.current = null;
      lockedRef.current = false;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (pendingXRef.current != null) flushPending();
      pendingXRef.current = null;
      setDragging(false);
      setAnnounced(Math.round(revealRef.current));
      node.style.touchAction = '';
      if (node.hasPointerCapture(pointerId)) {
        node.releasePointerCapture(pointerId);
      }
    },
    [flushPending],
  );

  const lockDrag = useCallback(
    (node: HTMLDivElement, pointerId: number, clientX: number) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      measure();
      node.style.touchAction = 'none';
      try {
        node.setPointerCapture(pointerId);
      } catch {
        // Untrusted or already-released pointers still update via move/up.
      }
      setDragging(true);
      queueFromClientX(clientX);
    },
    [measure, queueFromClientX],
  );

  // Native touchmove must be non-passive so we can block vertical scroll
  // after the gesture has locked onto the wipe.
  useEffect(() => {
    if (!dragging) return;
    const blockScroll = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', blockScroll, { passive: false });
    return () => document.removeEventListener('touchmove', blockScroll);
  }, [dragging]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    measure();
    originRef.current = { x: e.clientX, y: e.clientY };
    pointerIdRef.current = e.pointerId;
    const onHandle = Boolean((e.target as HTMLElement).closest('[data-ba-handle]'));
    if (onHandle || e.pointerType === 'mouse') {
      lockDrag(e.currentTarget, e.pointerId, e.clientX);
      e.preventDefault();
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    if (lockedRef.current) {
      queueFromClientX(e.clientX);
      return;
    }
    const origin = originRef.current;
    if (!origin) return;
    const dx = e.clientX - origin.x;
    const dy = e.clientY - origin.y;
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    if (Math.abs(dx) >= Math.abs(dy)) {
      lockDrag(e.currentTarget, e.pointerId, e.clientX);
      e.preventDefault();
    } else {
      pointerIdRef.current = null;
      originRef.current = null;
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    finishDrag(e.currentTarget, e.pointerId);
  };

  const onLostPointerCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    finishDrag(e.currentTarget, e.pointerId);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 4;
    let next = revealRef.current;
    if (e.key === 'ArrowLeft') next = clampReveal(next - step);
    else if (e.key === 'ArrowRight') next = clampReveal(next + step);
    else return;
    e.preventDefault();
    paintReveal(next);
    setAnnounced(Math.round(next));
  };

  return (
    <div
      ref={frameRef}
      data-lenis-prevent
      data-dragging={dragging || undefined}
      style={{ '--reveal': `${initial}%` } as React.CSSProperties}
      className="group relative aspect-4/5 w-full touch-pan-y cursor-ew-resize overflow-hidden rounded-sm bg-canvas-3 select-none [contain:layout_style_paint] data-[dragging]:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={onLostPointerCapture}
    >
      <picture>
        {paintedWebp && <source srcSet={paintedWebp} type="image/webp" />}
        <img
          src={paintedUrl}
          alt={paintedAlt}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </picture>

      <div
        className="absolute inset-0"
        style={{
          clipPath: 'inset(0 calc(100% - var(--reveal)) 0 0)',
          willChange: dragging ? 'clip-path' : undefined,
        }}
      >
        <picture>
          {aiWebp && <source srcSet={aiWebp} type="image/webp" />}
          <img
            src={aiUrl}
            alt={aiAlt}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-br from-verdigris/12 to-transparent" />
      </div>

      {/* Full-width track: translate3d(%) is relative to the track, not the knob. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-full"
        style={{
          transform: 'translate3d(var(--reveal), 0, 0)',
          willChange: dragging ? 'transform' : undefined,
        }}
      >
        <div className="absolute inset-y-0 left-0 w-px -translate-x-1/2 bg-gilt/80 shadow-[0_0_18px_2px] shadow-gilt/40" />

        {/* Full-height 44px grab strip so the divider is easy to catch on a phone. */}
        <div
          data-ba-handle
          aria-hidden
          className="pointer-events-auto absolute inset-y-0 left-0 z-10 w-11 -translate-x-1/2 touch-none"
        />

        <div
          data-ba-handle
          role="slider"
          tabIndex={0}
          aria-label="Reveal the AI concept versus the finished painting"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={announced}
          onKeyDown={onKeyDown}
          className={`pointer-events-auto absolute top-1/2 left-0 z-20 grid size-11 min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-full border border-gilt/60 bg-canvas/70 backdrop-blur-md transition-transform duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gilt ${
            dragging ? 'scale-110' : 'scale-100'
          }`}
        >
          <span className="text-xs tracking-widest text-gilt-bright">◂▸</span>
        </div>
      </div>

      <span className="pointer-events-none absolute top-4 left-4 rounded-full border border-white/10 bg-canvas/70 px-3 py-1 text-[0.6rem] tracking-[0.2em] text-ink-muted uppercase backdrop-blur-sm">
        AI concept
      </span>
      <span className="pointer-events-none absolute top-4 right-4 rounded-full border border-gilt/30 bg-canvas/70 px-3 py-1 text-[0.6rem] tracking-[0.2em] text-gilt-bright uppercase backdrop-blur-sm">
        Painted
      </span>
    </div>
  );
}
