import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

type Props = {
  aiUrl: string;
  paintedUrl: string;
  /** Starting reveal position, 0–100. */
  initial?: number;
};

/**
 * Drag-to-compare between the AI concept and the finished painting.
 *
 * Pointer position is written straight to state rather than through a motion
 * value because the clip-path and the handle must stay pixel-locked while
 * dragging — a spring on either one makes them visibly separate.
 */
export function BeforeAfter({ aiUrl, paintedUrl, initial = 55 }: Props) {
  const [reveal, setReveal] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const setFromClientX = useCallback((clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setReveal(Math.min(100, Math.max(0, pct)));
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => setFromClientX(e.clientX);
    const onUp = () => setDragging(false);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, setFromClientX]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 4;
    if (e.key === 'ArrowLeft') setReveal((r) => Math.max(0, r - step));
    if (e.key === 'ArrowRight') setReveal((r) => Math.min(100, r + step));
  };

  return (
    <div
      ref={frameRef}
      className="group relative aspect-4/5 w-full cursor-ew-resize overflow-hidden rounded-sm bg-canvas-3 select-none"
      onPointerDown={(e) => {
        setDragging(true);
        setFromClientX(e.clientX);
      }}
    >
      <img
        src={paintedUrl}
        alt="The finished hand-painted commission"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />

      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }}
      >
        <img
          src={aiUrl}
          alt="The AI-generated concept the customer designed"
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {/* Cool wash so the concept side reads as distinct from the painting. */}
        <div className="absolute inset-0 bg-gradient-to-br from-verdigris/12 to-transparent" />
      </div>

      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-gilt/80 shadow-[0_0_18px_2px] shadow-gilt/40"
        style={{ left: `${reveal}%` }}
      />

      <motion.div
        role="slider"
        tabIndex={0}
        aria-label="Reveal the AI concept versus the finished painting"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(reveal)}
        onKeyDown={onKeyDown}
        animate={{ scale: dragging ? 1.12 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="absolute top-1/2 z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-gilt/60 bg-canvas/70 backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gilt"
        style={{ left: `${reveal}%` }}
      >
        <span className="text-xs tracking-widest text-gilt-bright">◂▸</span>
      </motion.div>

      <span className="pointer-events-none absolute top-4 left-4 rounded-full border border-white/10 bg-canvas/70 px-3 py-1 text-[0.6rem] tracking-[0.2em] text-ink-muted uppercase backdrop-blur-sm">
        AI concept
      </span>
      <span className="pointer-events-none absolute top-4 right-4 rounded-full border border-gilt/30 bg-canvas/70 px-3 py-1 text-[0.6rem] tracking-[0.2em] text-gilt-bright uppercase backdrop-blur-sm">
        Painted
      </span>
    </div>
  );
}
