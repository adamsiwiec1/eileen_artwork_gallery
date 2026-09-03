'use client';

import { useCallback, useEffect, useState } from 'react';
import { FeatureDemo } from './feature-demo';
import { shouldShowFeatureDemo, writeFeatureDemoDismissed } from '@/lib/feature-demo-storage';

export interface TourStep {
  /** id of the element to spotlight for this step. */
  anchorId: string;
  title: string;
  body: string;
}

export const START_TOUR_EVENT = 'eileen:start-tour';

/**
 * Orchestrates a multi-step spotlight tour. Auto-starts on first visit
 * (respecting ?featureDemo=0/1) and can be replayed by dispatching a
 * window event named by `startEvent`.
 */
export function GuidedTour({
  steps,
  storageId,
  startEvent = START_TOUR_EVENT,
}: {
  steps: TourStep[];
  storageId: string;
  startEvent?: string;
}) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const resolveAnchor = useCallback(
    (i: number) => {
      const step = steps[i];
      if (!step || typeof document === 'undefined') return null;
      return document.getElementById(step.anchorId);
    },
    [steps],
  );

  const openAt = useCallback(
    (i: number) => {
      const el = resolveAnchor(i);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIndex(i);
      setAnchor(el);
      setOpen(true);
    },
    [resolveAnchor],
  );

  // Auto-start once on first visit.
  useEffect(() => {
    if (!steps.length) return;
    if (shouldShowFeatureDemo(storageId, { enabled: true })) {
      const t = setTimeout(() => openAt(0), 700);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual replay.
  useEffect(() => {
    const handler = () => openAt(0);
    window.addEventListener(startEvent, handler);
    return () => window.removeEventListener(startEvent, handler);
  }, [openAt, startEvent]);

  // Re-resolve the anchor after the smooth scroll settles.
  useEffect(() => {
    if (!open) return;
    setAnchor(resolveAnchor(index));
    const t = setTimeout(() => setAnchor(resolveAnchor(index)), 420);
    return () => clearTimeout(t);
  }, [open, index, resolveAnchor]);

  if (!steps.length) return null;

  const isLast = index >= steps.length - 1;
  const finish = (choice: 'completed' | 'skipped') => {
    writeFeatureDemoDismissed(storageId, choice);
    setOpen(false);
  };

  return (
    <FeatureDemo
      open={open}
      anchorEl={anchor}
      stepLabel={`Step ${index + 1} of ${steps.length}`}
      title={steps[index].title}
      body={steps[index].body}
      primaryLabel={isLast ? 'Done' : 'Next'}
      onPrimary={() => (isLast ? finish('completed') : openAt(index + 1))}
      secondaryLabel={index > 0 ? 'Back' : undefined}
      onSecondary={index > 0 ? () => openAt(index - 1) : undefined}
      tertiaryLabel={isLast ? undefined : 'Skip'}
      onTertiary={() => finish('skipped')}
      onClose={() => finish('skipped')}
    />
  );
}
