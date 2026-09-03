/**
 * Testimonial data for the before/after slideshow.
 *
 * `aiUrl` is the AI concept (generated on Eileen's Flux.2-klein LoRA via the
 * RunPod endpoint), `paintedUrl` is one of Eileen's finished hand-painted
 * pieces. Both are local 4:5 assets under /eileen/beforeafter, paired
 * subject-for-subject so the wipe reads as one piece evolving into the next.
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

/** Local before/after asset pair (4:5) under /eileen/beforeafter. */
const ba = (subject: string) => ({
  aiUrl: `/eileen/beforeafter/before-${subject}.jpg`,
  paintedUrl: `/eileen/beforeafter/after-${subject}.jpg`,
});

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'peonies',
    customer: 'Marguerite D.',
    location: 'Charleston, SC',
    medium: 'Oil on Canvas',
    size: '30 × 30 in',
    rushTier: 'Standard',
    rating: 5,
    quote:
      'I described my grandmother’s garden and what came back had her exact light in it. Up close, Eileen’s brushwork is astonishing — you can almost feel the heat coming off the peonies. It is the first thing anyone looks at when they walk in.',
    ...ba('peonies'),
  },
  {
    id: 'bouquet',
    customer: 'Devon & Priya R.',
    location: 'Brooklyn, NY',
    medium: 'Oil on Canvas',
    size: '36 × 48 in',
    rushTier: 'Priority',
    rating: 5,
    quote:
      'We wanted our wedding flowers to outlast the photographs — cream roses and the little blue ones my grandmother grew. Every layer feels deliberate, made by someone who clearly loves the subject. Against that near-black it honestly glows.',
    ...ba('bouquet'),
  },
  {
    id: 'woodland',
    customer: 'Hollis T.',
    location: 'Bozeman, MT',
    medium: 'Oil on Canvas',
    size: '24 × 36 in',
    rushTier: 'Express',
    rating: 5,
    quote:
      'It’s the path behind our old house — the one you could walk with your eyes shut. Soft where it should be, then one confident dark that holds the whole thing together. Nothing about it looks machine-made; it has real soul, and it anchors the room.',
    ...ba('woodland'),
  },
  {
    id: 'pear',
    customer: 'Sam O.',
    location: 'Portland, OR',
    medium: 'Oil on Canvas',
    size: '12 × 12 in',
    rushTier: 'Standard',
    rating: 5,
    quote:
      'I am not an art person and I could not have written a good prompt cold. I just said “a single green pear, nothing fancy,” then nudged the background cooler — that back-and-forth is what got it right. The surface has real texture. It is over the kitchen table now.',
    ...ba('pear'),
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
