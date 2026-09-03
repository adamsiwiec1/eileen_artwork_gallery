type Portrait = 'portrait' | 'studio' | 'with-work';

export function EileenPhoto({
  src,
  alt,
  className,
  priority,
}: {
  src: Portrait;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <picture>
      <source srcSet={`/eileen/${src}.webp`} type="image/webp" />
      <img
        src={`/eileen/${src}.jpg`}
        alt={alt}
        className={className}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'async' : 'async'}
        loading={priority ? 'eager' : 'lazy'}
      />
    </picture>
  );
}
