'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface FeatureDemoProps {
  open: boolean;
  /** Element to spotlight. When null, the card is centred as a plain modal. */
  anchorEl: HTMLElement | null;
  title: string;
  body: string;
  stepLabel?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  tertiaryLabel?: string;
  onTertiary?: () => void;
  onClose?: () => void;
}

const HOLE_PAD = 8;
const GAP = 14;
const POP_WIDTH = 340;

/**
 * A lightweight spotlight coach mark: dims the page, cuts a hole around the
 * anchor element (which stays interactive), and floats an explainer card
 * beside it. Tailwind port of the MUI feature-demo from the root repo.
 */
export function FeatureDemo(props: FeatureDemoProps) {
  const {
    open,
    anchorEl,
    title,
    body,
    stepLabel,
    primaryLabel,
    onPrimary,
    secondaryLabel,
    onSecondary,
    tertiaryLabel,
    onTertiary,
    onClose,
  } = props;

  const [mounted, setMounted] = useState(false);
  const [hole, setHole] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [popH, setPopH] = useState(220);
  const popRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      if (anchorEl) {
        const r = anchorEl.getBoundingClientRect();
        setHole({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setHole(null);
      }
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    let ro: ResizeObserver | undefined;
    if (anchorEl) {
      ro = new ResizeObserver(update);
      ro.observe(anchorEl);
    }
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      ro?.disconnect();
    };
  }, [open, anchorEl]);

  useEffect(() => {
    if (popRef.current) setPopH(popRef.current.offsetHeight);
  }, [open, title, body, hole, viewport]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => primaryRef.current?.focus());
  }, [open, title]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') (onClose ?? onTertiary)?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, onTertiary]);

  if (!open || !mounted) return null;

  const padded = hole
    ? {
        top: hole.top - HOLE_PAD,
        left: hole.left - HOLE_PAD,
        right: hole.left + hole.width + HOLE_PAD,
        bottom: hole.top + hole.height + HOLE_PAD,
        width: hole.width + HOLE_PAD * 2,
        height: hole.height + HOLE_PAD * 2,
      }
    : null;

  const popWidth = Math.min(POP_WIDTH, viewport.w - 32);
  const maxTop = Math.max(16, viewport.h - popH - 16);
  let popTop: number;
  let popLeft: number;
  if (padded) {
    popLeft = Math.min(Math.max(16, padded.left), Math.max(16, viewport.w - popWidth - 16));
    const below = padded.bottom + GAP;
    const fitsBelow = below + popH <= viewport.h - 16;
    const fitsAbove = padded.top - GAP - popH >= 16;
    // Prefer below, then above; for anchors taller than the viewport, pin
    // so the card is always visible instead of scrolling off-screen.
    popTop = fitsBelow ? below : fitsAbove ? padded.top - GAP - popH : maxTop;
    popTop = Math.min(Math.max(16, popTop), maxTop);
  } else {
    popLeft = Math.max(16, (viewport.w - popWidth) / 2);
    popTop = Math.min(Math.max(16, (viewport.h - popH) / 2), maxTop);
  }

  const mask = 'bg-black/70';

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      {padded ? (
        <>
          <div className={cn('absolute top-0 left-0 w-full', mask)} style={{ height: Math.max(0, padded.top) }} />
          <div className={cn('absolute left-0 w-full', mask)} style={{ top: padded.bottom, bottom: 0 }} />
          <div
            className={cn('absolute', mask)}
            style={{ top: padded.top, left: 0, width: Math.max(0, padded.left), height: padded.height }}
          />
          <div
            className={cn('absolute', mask)}
            style={{ top: padded.top, left: padded.right, right: 0, height: padded.height }}
          />
          <div
            className="pointer-events-none absolute rounded-xl ring-2 ring-gilt/70"
            style={{ top: padded.top, left: padded.left, width: padded.width, height: padded.height }}
          />
        </>
      ) : (
        <div className={cn('absolute inset-0', mask)} />
      )}

      <div
        ref={popRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="feature-demo-title"
        aria-describedby="feature-demo-body"
        className="animate-in fade-in-0 zoom-in-95 fixed rounded-2xl border border-gilt/30 bg-canvas-2/95 p-5 text-ink shadow-2xl shadow-black/60 backdrop-blur-xl duration-200"
        style={{ top: popTop, left: popLeft, width: popWidth }}
      >
        {stepLabel && (
          <p className="mb-1 text-[0.6rem] tracking-[0.24em] text-gilt uppercase">{stepLabel}</p>
        )}
        <h2 id="feature-demo-title" className="font-display text-lg text-balance text-ink">
          {title}
        </h2>
        <p id="feature-demo-body" className="mt-2 text-sm leading-relaxed text-ink-muted">
          {body}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {tertiaryLabel && onTertiary && (
            <button
              type="button"
              onClick={onTertiary}
              className="rounded-full px-3 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              {tertiaryLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="rounded-full border border-white/12 px-4 py-2 text-sm text-ink transition-colors hover:border-gilt/50"
            >
              {secondaryLabel}
            </button>
          )}
          <button
            ref={primaryRef}
            type="button"
            onClick={onPrimary}
            className="rounded-full bg-gilt px-5 py-2 text-sm font-medium text-canvas transition-all hover:bg-gilt-bright"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
