'use client';

import type { ReactNode } from 'react';

export function Marquee({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="animate-marquee flex w-max gap-8">
        <div className="flex gap-8">{children}</div>
        <div className="flex gap-8" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
