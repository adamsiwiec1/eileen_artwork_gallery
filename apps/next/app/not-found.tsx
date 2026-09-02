import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="bg-weave grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-[0.65rem] tracking-[0.3em] text-gilt uppercase">404</p>
        <h1 className="mt-4 font-display text-4xl text-ink">This canvas is blank.</h1>
        <Link href="/" className="mt-8 inline-block rounded-full bg-gilt px-7 py-3 text-sm text-canvas">
          Back to the gallery
        </Link>
      </div>
    </div>
  );
}
