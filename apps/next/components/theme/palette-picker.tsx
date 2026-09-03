'use client';

import { useTheme } from './theme-provider';
import { THEMES } from './theme-config';
import { cn } from '@/lib/utils';

export function PalettePicker({ className }: { className?: string }) {
  const { theme, setTheme, mounted } = useTheme();

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {THEMES.map((t) => {
        const active = mounted && theme === t.id;
        const dots = [t.swatch.canvas, t.swatch.gilt, t.swatch.rose, t.swatch.periwinkle, t.swatch.ink];
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            aria-pressed={active}
            className={cn(
              'group relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gilt',
              active
                ? 'border-gilt/70 bg-gilt/10 shadow-[0_0_34px_-12px] shadow-gilt/50'
                : 'border-white/10 hover:border-white/25 hover:bg-white/[0.03]',
            )}
          >
            <span className="flex shrink-0 -space-x-1.5" aria-hidden>
              {dots.map((c, i) => (
                <span
                  key={i}
                  className="size-6 rounded-full border border-black/40 shadow-sm"
                  style={{ backgroundColor: c }}
                />
              ))}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="font-display text-base text-ink">{t.name}</span>
                {active && (
                  <span className="rounded-full bg-gilt/20 px-2 py-0.5 text-[0.55rem] tracking-[0.16em] text-gilt-bright uppercase">
                    Live
                  </span>
                )}
              </span>
              <span className="mt-0.5 block truncate text-xs text-ink-muted">{t.tagline}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
