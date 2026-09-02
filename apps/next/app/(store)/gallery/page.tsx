import type { Metadata } from 'next';
import { GalleryView } from './view';

export const metadata: Metadata = {
  title: 'Gallery — Recent Commissions',
  description:
    'Browse recent hand-painted commissions in oil, acrylic, watercolour, charcoal and gold leaf.',
};

export default function GalleryPage() {
  return <GalleryView />;
}
