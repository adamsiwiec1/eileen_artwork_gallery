'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { money, moneyExact } from '@/lib/money';
import type { Order } from '@/lib/types';

type Detail = Order & { profitCents: number };

const presets = ['accepted', 'in_progress', 'ready_to_ship', 'shipped', 'denied'] as const;

export default function AdminOrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [preset, setPreset] = useState<(typeof presets)[number]>('in_progress');
  const [pickupMin, setPickupMin] = useState('');
  const [pickupMax, setPickupMax] = useState('');

  const load = async () => {
    const res = await fetch(`/api/admin/orders/${id}`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? 'Missing order');
    setOrder(body);
  };

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [id]);

  const patch = async (body: Partial<Order>) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const next = await res.json();
    if (!res.ok) throw new Error(next.error);
    setOrder(next);
  };

  const post = async (path: string, body?: unknown) => {
    const res = await fetch(`/api/admin/orders/${id}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const next = await res.json();
    if (!res.ok) throw new Error(next.error);
    setOrder(next.order ?? next);
  };

  if (!order) return <p className="text-sm text-muted-foreground">{error ?? 'Loading…'}</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
            <h1 className="text-2xl font-medium">{order.customerName}</h1>
            <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
          </div>
          <Badge>{order.status.replaceAll('_', ' ')}</Badge>
        </div>
        <img src={order.imageUrl} alt="" className="aspect-square w-full max-w-md rounded-md object-cover" />
        <Card>
          <CardHeader>
            <CardTitle>Brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{order.brief}</p>
            <p>
              {order.mediumId} · {order.sizeId} · {order.rushTierId}
              {order.framed ? ' · framed' : ''}
            </p>
            <p>
              {order.address.street1}, {order.address.city} {order.address.state} {order.address.zip}
            </p>
            <p>
              Selected ship: {order.selectedService ?? '—'} · quoted total {money(order.totalCents)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Costs & profit</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              ['canvasCents', 'Canvas $', order.canvasCents],
              ['paintCents', 'Paint $', order.paintCents],
              ['otherMaterialsCents', 'Other materials $', order.otherMaterialsCents],
              ['hourlyRateCents', 'Hourly rate $', order.hourlyRateCents],
            ].map(([key, label, value]) => (
              <div key={String(key)} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={(Number(value) / 100).toString()}
                  onChange={(e) =>
                    setOrder({ ...order, [key]: Math.round(Number(e.target.value || 0) * 100) })
                  }
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label>Hours worked</Label>
              <Input
                type="number"
                step="0.25"
                value={order.hoursWorked}
                onChange={(e) => setOrder({ ...order, hoursWorked: Number(e.target.value || 0) })}
              />
            </div>
            <Button
              onClick={() =>
                void patch({
                  canvasCents: order.canvasCents,
                  paintCents: order.paintCents,
                  otherMaterialsCents: order.otherMaterialsCents,
                  hoursWorked: order.hoursWorked,
                  hourlyRateCents: order.hourlyRateCents,
                }).catch((err: Error) => setError(err.message))
              }
            >
              Save costs
            </Button>
            <p className="text-sm">
              Paid {moneyExact(order.totalCents)} − materials − labor − postage{' '}
              {moneyExact(order.postageCents)} ={' '}
              <strong>{moneyExact(order.profitCents)}</strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Label & pickup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.labelUrl ? (
              <p className="text-sm">
                Tracking {order.trackingCode} ·{' '}
                <a className="underline" href={order.labelUrl} target="_blank" rel="noreferrer">
                  Open label
                </a>
              </p>
            ) : (
              <Button
                onClick={() => void post('/label').catch((err: Error) => setError(err.message))}
              >
                Buy selected rate
              </Button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Pickup from</Label>
                <Input type="datetime-local" value={pickupMin} onChange={(e) => setPickupMin(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Pickup until</Label>
                <Input type="datetime-local" value={pickupMax} onChange={(e) => setPickupMax(e.target.value)} />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                void post('/pickup', {
                  min: pickupMin,
                  max: pickupMax,
                  instructions: 'Studio pickup',
                }).catch((err: Error) => setError(err.message))
              }
            >
              Schedule pickup
            </Button>
            {order.pickupConfirmation && (
              <p className="text-sm text-muted-foreground">Confirmation {order.pickupConfirmation}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={preset}
              onChange={(e) => setPreset(e.target.value as (typeof presets)[number])}
            >
              {presets.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
            <Button
              onClick={() =>
                void post('/email', { preset, note }).catch((err: Error) => setError(err.message))
              }
            >
              Send email
            </Button>
          </CardContent>
        </Card>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
