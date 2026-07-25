import { Link } from 'react-router';

import { Seo } from '../components/Seo';

export function NotFound() {
  return (
    <>
      <Seo
        title="Not Found | Eileen"
        description="That page does not exist."
        path="/404"
      />
      <meta name="robots" content="noindex" />

      <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-6 text-center">
        <div>
          <p className="font-display text-7xl text-white/[0.09]">404</p>
          <h1 className="mt-4 font-display text-3xl text-ink">Nothing hanging here.</h1>
          <p className="mt-4 text-base text-ink-muted">
            The page you were looking for has been taken down or never existed.
          </p>
          <Link
            to="/"
            className="mt-9 inline-block rounded-full border border-gilt/40 bg-gilt/10 px-7 py-3 text-sm text-gilt-bright transition-all hover:bg-gilt/20"
          >
            Back to the gallery
          </Link>
        </div>
      </div>
    </>
  );
}
