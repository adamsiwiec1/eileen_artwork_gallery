'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { api } from '@/lib/api';
import { money } from '@/lib/money';
import type { Address, Catalog, CheckoutResult, Quote, ShippingRate } from '@/lib/types';

type Props = {
  catalog: Catalog;
  sessionId: string;
  imageUrl: string;
  onOrdered: (result: CheckoutResult) => void;
};

const emptyAddress: Address = {
  name: '',
  street1: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
};

export function Configurator({ catalog, sessionId, imageUrl, onOrdered }: Props) {
  const [mediumId, setMediumId] = useState(catalog.mediums[0]?.id ?? '');
  const [sizeId, setSizeId] = useState(catalog.sizes[1]?.id ?? catalog.sizes[0]?.id ?? '');
  const [rushTierId, setRushTierId] = useState(catalog.rushTiers[0]?.id ?? '');
  const [framed, setFramed] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [shipmentId, setShipmentId] = useState<string>();
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [ratesBusy, setRatesBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRate = useMemo(
    () => rates.find((rate) => rate.rushTierId === rushTierId) ?? rates[0],
    [rates, rushTierId],
  );

  const addressReady =
    address.name.trim().length > 1 &&
    address.street1.trim().length > 2 &&
    address.city.trim().length > 1 &&
    address.state.trim().length >= 2 &&
    address.zip.trim().length >= 3;

  useEffect(() => {
    if (!addressReady) {
      setRates([]);
      setShipmentId(undefined);
      return;
    }
    let cancelled = false;
    setRatesBusy(true);
    api
      .rates({ ...address, name: address.name })
      .then((result) => {
        if (cancelled) return;
        setShipmentId(result.shipmentId);
        setRates(result.rates);
      })
      .catch(() => {
        if (!cancelled) setRates([]);
      })
      .finally(() => {
        if (!cancelled) setRatesBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address.city, address.name, address.state, address.street1, address.street2, address.zip, addressReady]);

  useEffect(() => {
    if (!mediumId || !sizeId || !rushTierId) return;
    let cancelled = false;
    api
      .quote({
        mediumId,
        sizeId,
        rushTierId,
        framed,
        shippingCents: selectedRate?.amountCents,
        shippingLabel: selectedRate
          ? `${selectedRate.carrier} ${selectedRate.service}`
          : undefined,
      })
      .then((q) => !cancelled && setQuote(q))
      .catch(() => !cancelled && setQuote(null));
    return () => {
      cancelled = true;
    };
  }, [mediumId, sizeId, rushTierId, framed, selectedRate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      onOrdered(
        await api.checkout({
          sessionId,
          mediumId,
          sizeId,
          rushTierId,
          framed,
          name: address.name,
          email,
          address,
          easypostShipmentId: shipmentId,
          selectedRateId: selectedRate?.id,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof Address, placeholder: string, extra?: string) => (
    <input
      required={key !== 'street2' && key !== 'phone'}
      value={(address[key] as string) ?? ''}
      onChange={(e) => setAddress((prev) => ({ ...prev, [key]: e.target.value }))}
      placeholder={placeholder}
      aria-label={placeholder}
      className={`w-full rounded-sm border border-white/[0.1] bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-muted/50 focus:border-gilt/50 focus:outline-none ${extra ?? ''}`}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="grid gap-10 lg:grid-cols-[1fr_22rem]"
    >
      <div className="space-y-10">
        <fieldset>
          <legend className="text-[0.65rem] tracking-[0.24em] text-gilt uppercase">01 — Medium</legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {catalog.mediums.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMediumId(m.id)}
                aria-pressed={mediumId === m.id}
                className={`relative rounded-sm border p-5 text-left transition-all duration-300 ${
                  mediumId === m.id
                    ? 'border-gilt/60 bg-gilt/[0.06]'
                    : 'border-white/[0.08] hover:border-white/25'
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-lg text-ink">{m.name}</p>
                  <span className="shrink-0 text-xs text-ink-muted">×{m.priceMultiplier.toFixed(2)}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{m.blurb}</p>
                <p className="mt-3 text-[0.68rem] tracking-wide text-ink-muted/60">{m.texture}</p>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[0.65rem] tracking-[0.24em] text-gilt uppercase">02 — Size</legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {catalog.sizes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSizeId(s.id)}
                aria-pressed={sizeId === s.id}
                className={`group flex flex-col items-center rounded-sm border p-5 transition-all duration-300 ${
                  sizeId === s.id
                    ? 'border-gilt/60 bg-gilt/[0.06]'
                    : 'border-white/[0.08] hover:border-white/25'
                }`}
              >
                <span
                  className={`w-full max-w-16 rounded-[1px] border transition-colors ${
                    sizeId === s.id ? 'border-gilt/70 bg-gilt/15' : 'border-white/15 bg-white/[0.03]'
                  }`}
                  style={{ aspectRatio: String(s.aspect), height: `${1.4 + s.basePriceCents / 40000}rem` }}
                  aria-hidden
                />
                <p className="mt-4 text-sm text-ink">{s.name}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{s.inches}</p>
              </button>
            ))}
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={framed}
              onChange={(e) => setFramed(e.target.checked)}
              className="size-4 accent-[#c8a468]"
            />
            Add a hand-finished hardwood frame
          </label>
        </fieldset>

        <fieldset>
          <legend className="text-[0.65rem] tracking-[0.24em] text-gilt uppercase">
            03 — When you need it
          </legend>
          <div className="mt-5 space-y-3">
            {catalog.rushTiers.map((t) => {
              const rate = rates.find((r) => r.rushTierId === t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setRushTierId(t.id)}
                  aria-pressed={rushTierId === t.id}
                  className={`flex w-full items-center gap-5 rounded-sm border p-5 text-left transition-all duration-300 ${
                    rushTierId === t.id
                      ? 'border-gilt/60 bg-gilt/[0.06]'
                      : 'border-white/[0.08] hover:border-white/25'
                  }`}
                >
                  <span
                    className={`grid size-4 shrink-0 place-items-center rounded-full border ${
                      rushTierId === t.id ? 'border-gilt' : 'border-white/25'
                    }`}
                  >
                    {rushTierId === t.id && <span className="size-2 rounded-full bg-gilt" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-3">
                      <span className="text-ink">{t.name}</span>
                      <span className="font-display text-lg text-gilt-bright">{t.leadTime}</span>
                    </span>
                    <span className="mt-1 block text-sm text-ink-muted">{t.description}</span>
                    {rate && (
                      <span className="mt-2 block text-xs text-gilt">
                        {rate.carrier} {rate.service}
                        {rate.days ? ` · ${rate.days} transit days` : ''}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm text-ink-muted">
                    {rate ? money(rate.amountCents) : ratesBusy ? '…' : 'Enter address'}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <form
          onSubmit={submit}
          className="rounded-sm border border-white/[0.08] bg-canvas-2/60 p-6 backdrop-blur-sm"
        >
          <img src={imageUrl} alt="Your finished concept" className="aspect-square w-full rounded-sm object-cover" />

          <div className="mt-6 space-y-2.5">
            <AnimatePresence mode="popLayout">
              {quote?.lines.map((line) => (
                <motion.div
                  key={line.label}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <span className="text-ink-muted">{line.label}</span>
                  <span className="shrink-0 text-ink">{money(line.amountCents)}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-5 flex items-baseline justify-between border-t border-white/[0.08] pt-5">
            <span className="text-sm text-ink-muted">Total</span>
            <motion.span
              key={quote?.totalCents}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl text-ink"
            >
              {quote ? money(quote.totalCents) : '—'}
            </motion.span>
          </div>

          {quote && (
            <p className="mt-2 text-xs text-gilt">
              Arrives in {quote.estimatedDays.min}–{quote.estimatedDays.max} days
            </p>
          )}

          <div className="mt-6 space-y-3">
            {field('name', 'Your name')}
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Your email address"
              className="w-full rounded-sm border border-white/[0.1] bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-muted/50 focus:border-gilt/50 focus:outline-none"
            />
            {field('street1', 'Street address')}
            {field('street2', 'Apt, suite (optional)')}
            <div className="grid grid-cols-2 gap-3">
              {field('city', 'City')}
              {field('state', 'State')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field('zip', 'ZIP')}
              {field('country', 'Country')}
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-rose">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !quote || !selectedRate}
            className="mt-5 w-full rounded-full bg-gilt py-3.5 text-sm font-medium text-canvas transition-all duration-300 hover:bg-gilt-bright hover:shadow-[0_0_34px_-6px] hover:shadow-gilt/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? 'Reserving your slot…' : 'Commission this piece'}
          </button>
          <p className="mt-3 text-center text-[0.68rem] leading-relaxed text-ink-muted/60">
            Shipping rates are shopped in EasyPost test mode. Postage is not purchased until the
            studio accepts. Payment is still simulated.
          </p>
        </form>
      </aside>
    </motion.div>
  );
}
