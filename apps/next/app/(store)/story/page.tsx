import type { Metadata } from 'next';
import { StoryView } from './view';

export const metadata: Metadata = {
  title: { absolute: 'My Story — Eileen Butler' },
  description:
    'The story behind the paintings — how Eileen Butler went from building AI products in consumer tech to picking up a brush late at night and never putting it down.',
  openGraph: {
    title: 'My Story — Eileen Butler',
    description:
      'How a product leader working in AI and behavioral science found her way back to painting.',
    images: [{ url: '/eileen/story/story-1.jpg', width: 1057, height: 1200, alt: 'Eileen Butler beside her peony painting' }],
  },
};

export default function StoryPage() {
  return <StoryView />;
}
