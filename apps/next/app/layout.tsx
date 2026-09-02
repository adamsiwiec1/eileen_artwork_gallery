import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

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
    default: 'Eileen — Custom Hand-Painted Art From Your Imagination',
    template: '%s | Eileen',
  },
  description:
    'Describe the painting you have always wanted, refine it in conversation, then have it hand-painted in oil, acrylic, watercolour or charcoal.',
  openGraph: {
    title: 'Eileen — Custom Hand-Painted Art',
    description: 'Commissioned originals, designed in conversation and painted by hand.',
    images: ['https://picsum.photos/seed/eileen-og/1200/630'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
