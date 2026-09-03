import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StudioView } from './view';

export const metadata: Metadata = {
  title: 'The Studio — Design with her muse',
  description:
    'Write a sentence or upload a photo, and an AI shaped on Eileen Butler’s own work dreams up an original concept in her style. Refine it, then have her paint it by hand.',
};

export default function StudioPage() {
  return (
    <Suspense>
      <StudioView />
    </Suspense>
  );
}
