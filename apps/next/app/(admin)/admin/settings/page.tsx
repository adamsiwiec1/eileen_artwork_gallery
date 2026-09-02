'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StudioSettings } from '@/lib/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        setSettings(body);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (!settings) return <p className="text-sm text-muted-foreground">{error ?? 'Loading…'}</p>;

  const dollars = (cents: number) => (cents / 100).toString();
  const setCents = (key: keyof StudioSettings, value: string) =>
    setSettings({ ...settings, [key]: Math.round(Number(value || 0) * 100) });

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Studio costs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Default hourly rate</Label>
          <Input
            type="number"
            step="0.01"
            value={dollars(settings.hourlyRateCents)}
            onChange={(e) => setCents('hourlyRateCents', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Default canvas</Label>
          <Input
            type="number"
            step="0.01"
            value={dollars(settings.defaultCanvasCents)}
            onChange={(e) => setCents('defaultCanvasCents', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Default paint</Label>
          <Input
            type="number"
            step="0.01"
            value={dollars(settings.defaultPaintCents)}
            onChange={(e) => setCents('defaultPaintCents', e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-muted-foreground">Saved.</p>}
        <Button
          onClick={async () => {
            setSaved(false);
            const res = await fetch('/api/admin/settings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(settings),
            });
            const body = await res.json();
            if (!res.ok) {
              setError(body.error);
              return;
            }
            setSettings(body);
            setSaved(true);
          }}
        >
          Save defaults
        </Button>
      </CardContent>
    </Card>
  );
}
