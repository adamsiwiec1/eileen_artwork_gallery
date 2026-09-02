'use client';

import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="text-muted-foreground hover:text-foreground"
      onClick={async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
