import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CompleteView } from './view';

export const metadata: Metadata = {
  title: 'Commission Confirmed',
  description: 'Your commission is confirmed and queued in the studio.',
  robots: { index: false, follow: false },
};

export default function CompletePage() {
  return (
    <Suspense>
      <CompleteView />
    </Suspense>
  );
}
