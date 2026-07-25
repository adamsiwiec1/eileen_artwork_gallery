/**
 * Placeholder testimonial data for the before/after slideshow.
 *
 * `aiUrl` is the generated concept, `paintedUrl` is the finished physical piece.
 * Both point at Picsum seeds so the layout is exercised with real image
 * dimensions; swap in customer photos when they exist.
 */

export type Testimonial = {
  id: string;
  customer: string;
  location: string;
  medium: string;
  size: string;
  rushTier: string;
  rating: number;
  quote: string;
  aiUrl: string;
  paintedUrl: string;
};

const img = (seed: string) => `https://picsum.photos/seed/${seed}/1200/1500`;

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    customer: 'Marguerite D.',
    location: 'Charleston, SC',
    medium: 'Oil on Canvas',
    size: '24 × 36 in',
    rushTier: 'Standard',
    rating: 5,
    quote:
      'I described my grandmother’s garden from memory and watched it appear. Three rounds of notes and it was exactly the light I remembered. The painting arrived and I cried in the hallway.',
    aiUrl: img('eileen-ai-garden'),
    paintedUrl: img('eileen-real-garden'),
  },
  {
    id: 't2',
    customer: 'Devon & Priya R.',
    location: 'Brooklyn, NY',
    medium: 'Oil with Gold Leaf',
    size: '36 × 48 in',
    rushTier: 'Priority',
    rating: 5,
    quote:
      'We wanted our wedding venue at golden hour but nobody took a decent photo. Fifteen minutes of back-and-forth got us closer than any photograph would have. The gold leaf in person is unreal.',
    aiUrl: img('eileen-ai-wedding'),
    paintedUrl: img('eileen-real-wedding'),
  },
  {
    id: 't3',
    customer: 'Hollis T.',
    location: 'Bozeman, MT',
    medium: 'Watercolour on Cotton Rag',
    size: '18 × 24 in',
    rushTier: 'Express',
    rating: 5,
    quote:
      'Ordered on a Tuesday in a panic about an anniversary. It was framed on the wall by Saturday. The washes are so soft — it does not look like anything a machine touched.',
    aiUrl: img('eileen-ai-mountain'),
    paintedUrl: img('eileen-real-mountain'),
  },
  {
    id: 't4',
    customer: 'Aunty Béatrice',
    location: 'Montréal, QC',
    medium: 'Charcoal & Graphite',
    size: '12 × 16 in',
    rushTier: 'Standard',
    rating: 5,
    quote:
      'My old dog, from a blurry phone picture and a lot of description. I kept saying “kinder eyes” and it kept understanding. He is above the fireplace now.',
    aiUrl: img('eileen-ai-dog'),
    paintedUrl: img('eileen-real-dog'),
  },
  {
    id: 't5',
    customer: 'Sam O.',
    location: 'Portland, OR',
    medium: 'Acrylic on Canvas',
    size: '24 × 36 in',
    rushTier: 'Priority',
    rating: 5,
    quote:
      'The conversation part is the whole trick. I am not an art person and I could not have written a good prompt cold. Being able to just say “less busy on the left” is what got it right.',
    aiUrl: img('eileen-ai-coast'),
    paintedUrl: img('eileen-real-coast'),
  },
];

export type GalleryPiece = {
  id: string;
  title: string;
  medium: string;
  size: string;
  url: string;
  /** Rough tile weight so the masonry grid stays visually varied. */
  span: 'tall' | 'wide' | 'square';
};

export const GALLERY: GalleryPiece[] = [
  { id: 'g1', title: 'Low Tide, Late Sun', medium: 'Oil on Canvas', size: '24 × 36 in', url: img('eileen-g1'), span: 'tall' },
  { id: 'g2', title: 'Kitchen Window, February', medium: 'Watercolour', size: '18 × 24 in', url: img('eileen-g2'), span: 'square' },
  { id: 'g3', title: 'The Long Field', medium: 'Oil on Canvas', size: '36 × 48 in', url: img('eileen-g3'), span: 'wide' },
  { id: 'g4', title: 'Study of a Sleeping Hound', medium: 'Charcoal', size: '12 × 16 in', url: img('eileen-g4'), span: 'square' },
  { id: 'g5', title: 'Gilded Interior', medium: 'Oil with Gold Leaf', size: '24 × 36 in', url: img('eileen-g5'), span: 'tall' },
  { id: 'g6', title: 'Harbour, Blue Hour', medium: 'Acrylic on Canvas', size: '18 × 24 in', url: img('eileen-g6'), span: 'square' },
  { id: 'g7', title: 'Peonies, Overblown', medium: 'Watercolour', size: '12 × 16 in', url: img('eileen-g7'), span: 'square' },
  { id: 'g8', title: 'Road Out of Town', medium: 'Oil on Canvas', size: '24 × 36 in', url: img('eileen-g8'), span: 'wide' },
];
