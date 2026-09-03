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
    default: 'Eileen Butler — Hand-painted originals from the East Coast',
    template: '%s | Eileen Butler',
  },
  description:
    'Eileen Butler paints commissioned originals for people — gardens, harbours, motorcycles and cars — then finishes each one by hand.',
  openGraph: {
    title: 'Eileen Butler — Hand-painted originals',
    description:
      'The East Coast painter people ask for, because she likes making the picture for you.',
    images: [{ url: '/eileen/og.jpg', width: 1200, height: 630, alt: 'Eileen Butler' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
