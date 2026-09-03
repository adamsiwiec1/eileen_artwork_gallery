import type { Metadata } from 'next';
import { GalleryView } from './view';

export const metadata: Metadata = {
  title: 'Gallery — Pictures she painted for herself',
  description:
    'Work by Eileen Butler, one of the East Coast’s most celebrated painters: places, family light, and the motorcycles and cars she paints as if they still run.',
};

export default function GalleryPage() {
  return <GalleryView />;
}
