export type ThemeId = 'dusk' | 'gilt' | 'ocean' | 'mono' | 'rose';

export const DEFAULT_THEME: ThemeId = 'dusk';
export const THEME_STORAGE_KEY = 'eileen-theme';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tagline: string;
  /** Representative swatches used by the picker preview. */
  swatch: { canvas: string; ink: string; gilt: string; rose: string; periwinkle: string };
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'dusk',
    name: 'Dusk',
    tagline: 'Mauve, periwinkle & rose on indigo',
    swatch: { canvas: '#0b0a14', ink: '#f3eef8', gilt: '#d2a3c4', rose: '#c45d7a', periwinkle: '#9aafdc' },
  },
  {
    id: 'gilt',
    name: 'Gilt',
    tagline: 'Warm gold on espresso',
    swatch: { canvas: '#0f0b06', ink: '#f8f0e1', gilt: '#d7a94f', rose: '#d1774f', periwinkle: '#cbb072' },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    tagline: 'Sea glass & coral on deep water',
    swatch: { canvas: '#04121a', ink: '#e8f6fb', gilt: '#57b3c2', rose: '#e08469', periwinkle: '#6aa8d8' },
  },
  {
    id: 'mono',
    name: 'Mono Gallery',
    tagline: 'Quiet museum neutrals',
    swatch: { canvas: '#0b0b0c', ink: '#f5f5f6', gilt: '#c8bcae', rose: '#c58f8f', periwinkle: '#b9bdc5' },
  },
  {
    id: 'rose',
    name: 'Rose',
    tagline: 'Blush & orchid on plum',
    swatch: { canvas: '#150713', ink: '#fbedf3', gilt: '#e5a1b6', rose: '#db6089', periwinkle: '#cb8fc6' },
  },
];

export const THEME_IDS = THEMES.map((t) => t.id) as ThemeId[];

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as string[]).includes(value);
}
