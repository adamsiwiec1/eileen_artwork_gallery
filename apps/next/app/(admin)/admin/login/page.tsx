'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid min-h-[70vh] place-items-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Hi Eileen</CardTitle>
          <CardDescription>
            This is your studio console. The password is your phone number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, pass }),
              });
              const body = (await res.json()) as { error?: string };
              setBusy(false);
              if (!res.ok) {
                setError(body.error ?? 'Could not sign in');
                return;
              }
              router.push('/admin');
              router.refresh();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass">Your phone number</Label>
              <Input
                id="pass"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Enter the studio'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
