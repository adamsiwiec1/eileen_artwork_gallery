import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { AdminDemoPointer } from '@/components/demo/admin-demo-pointer';
import { DEFAULT_THEME, THEME_IDS, THEME_STORAGE_KEY } from '@/components/theme/theme-config';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600'],
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['300', '400', '500'],
});

export const metadata: Metadata = {
  title: {
    default: 'Eileen Butler — Hand-painted originals from the East Coast',
    template: '%s | Eileen Butler',
  },
  description:
    'One of the East Coast’s most celebrated painters. Her studio pairs an AI shaped on Eileen Butler’s own work with her own hand — it dreams up an original in her style, you refine it, and she can paint it by hand.',
  openGraph: {
    title: 'Eileen Butler — Original paintings from the East Coast',
    description:
      'One of the East Coast’s most celebrated painters, with an AI muse that dreams in her style.',
    images: [{ url: '/eileen/og.jpg', width: 1200, height: 630, alt: 'Eileen Butler' }],
  },
};

// Set data-theme before paint so the chosen palette never flashes.
const themeInitScript = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)};var allowed=${JSON.stringify(THEME_IDS)};var t=localStorage.getItem(k);var v=allowed.indexOf(t)>-1?t:${JSON.stringify(
  DEFAULT_THEME,
)};document.documentElement.setAttribute('data-theme',v);}catch(e){document.documentElement.setAttribute('data-theme',${JSON.stringify(
  DEFAULT_THEME,
)});}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          {children}
          <AdminDemoPointer />
        </ThemeProvider>
      </body>
    </html>
  );
}
