import { buildQuote, type Quote, type QuoteRequest } from './catalog';

export function withShipping(quote: Quote, shippingCents: number, label: string): Quote {
  if (shippingCents <= 0) return quote;
  const lines = [...quote.lines, { label, amountCents: shippingCents }];
  return {
    ...quote,
    lines,
    totalCents: quote.totalCents + shippingCents,
  };
}

export function quoteWithShipping(
  req: QuoteRequest,
  shipping?: { amountCents: number; label: string },
): Quote {
  const quote = buildQuote(req);
  if (!shipping?.amountCents) return quote;
  return withShipping(quote, shipping.amountCents, shipping.label);
}
