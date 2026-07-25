/**
 * Per-route document metadata.
 *
 * React 19 hoists <title>, <meta> and <link> rendered anywhere in the tree into
 * <head> and dedupes them, so this needs no Helmet provider and no framework.
 * Rendering it inside a route replaces the baseline tags from index.html.
 */

const SITE = 'https://eileen.art';

type Props = {
  title: string;
  description: string;
  path: string;
  image?: string;
  /** Serialised as a JSON-LD block. Use schema.org shapes. */
  jsonLd?: Record<string, unknown>;
};

export function Seo({ title, description, path, image, jsonLd }: Props) {
  const url = `${SITE}${path}`;
  const ogImage = image ?? `${SITE}/og-default.jpg`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </>
  );
}
