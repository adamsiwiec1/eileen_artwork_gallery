import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StudioView } from './view';

export const metadata: Metadata = {
  title: 'The Studio — Design Your Commission',
  description:
    'Describe your painting, refine it in conversation, then choose medium, size and lead time.',
};

export default function StudioPage() {
  return (
    <Suspense>
      <StudioView />
    </Suspense>
  );
}
