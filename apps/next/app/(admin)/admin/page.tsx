'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { money } from '@/lib/money';
import type { Order } from '@/lib/types';

type Row = Order & { profitCents: number };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    fetch('/api/admin/orders')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? 'Could not load orders');
        setOrders(body.orders);
      })
      .catch((err: Error) => setError(err.message));

  useEffect(() => {
    void load();
  }, []);

  const act = async (id: string, action: 'accept' | 'deny') => {
    await fetch(`/api/admin/orders/${id}/${action}`, { method: 'POST' });
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Orders</h1>
        <p className="text-sm text-muted-foreground">Accept or deny, then buy a label after you accept.</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Speed</TableHead>
            <TableHead>Quoted</TableHead>
            <TableHead>Profit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs">{order.id}</TableCell>
              <TableCell>
                <div>{order.customerName}</div>
                <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
              </TableCell>
              <TableCell className="capitalize">{order.rushTierId}</TableCell>
              <TableCell>{money(order.totalCents)}</TableCell>
              <TableCell>{money(order.profitCents)}</TableCell>
              <TableCell>
                <Badge variant={order.status === 'denied' ? 'destructive' : 'secondary'}>
                  {order.status.replaceAll('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2 text-right">
                {order.status === 'pending_review' && (
                  <>
                    <Button size="sm" onClick={() => void act(order.id, 'accept')}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void act(order.id, 'deny')}>
                      Deny
                    </Button>
                  </>
                )}
                <Link href={`/admin/orders/${order.id}`} className="text-sm underline-offset-4 hover:underline">
                  Open
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {!orders.length && (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground">
                No commissions yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
