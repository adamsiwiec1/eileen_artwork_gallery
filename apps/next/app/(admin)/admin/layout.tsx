import Link from 'next/link';
import { peekAdmin } from '@/lib/admin-session';
import { SignOutButton } from '@/components/admin/sign-out-button';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await peekAdmin();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Studio console</p>
            <p className="text-lg font-medium">Eileen Admin</p>
          </div>
          {email && (
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin" className="hover:underline">
                Orders
              </Link>
              <Link href="/admin/settings" className="hover:underline">
                Studio costs
              </Link>
              <span className="text-muted-foreground">{email}</span>
              <SignOutButton />
            </nav>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
