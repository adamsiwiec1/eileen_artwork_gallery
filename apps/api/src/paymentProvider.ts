/**
 * Payment provider seam.
 *
 * The processor is undecided, so nothing above this file knows which one we
 * use. Adding Stripe or Square later means writing one class here and changing
 * the switch in `createPaymentProvider` — no route or UI changes.
 */

export type CheckoutRequest = {
  orderId: string;
  amountCents: number;
  currency: string;
  description: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutSession = {
  /** Where the browser should be sent to pay. */
  redirectUrl: string;
  sessionId: string;
  provider: string;
  /** True when no real money can move, so the UI can badge it clearly. */
  simulated: boolean;
};

export interface PaymentProvider {
  readonly name: string;
  createCheckoutSession(req: CheckoutRequest): Promise<CheckoutSession>;
  /** Verify and interpret an inbound webhook. Returns null when unrecognised. */
  handleWebhook(
    rawBody: string,
    signature: string | undefined,
  ): Promise<{ orderId: string; status: 'paid' | 'failed' } | null>;
}

class PlaceholderPaymentProvider implements PaymentProvider {
  readonly name = 'placeholder';

  async createCheckoutSession(req: CheckoutRequest): Promise<CheckoutSession> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const sessionId = `sim_${Math.random().toString(36).slice(2, 12)}`;

    // Hand back an in-app route rather than an external processor page.
    const url = new URL(req.successUrl);
    url.searchParams.set('session', sessionId);
    url.searchParams.set('simulated', '1');

    return { redirectUrl: url.toString(), sessionId, provider: this.name, simulated: true };
  }

  async handleWebhook() {
    return null;
  }
}

export function createPaymentProvider(): PaymentProvider {
  switch (process.env.PAYMENT_PROVIDER) {
    // case 'stripe':  return new StripePaymentProvider(process.env.STRIPE_SECRET_KEY!);
    // case 'square':  return new SquarePaymentProvider(process.env.SQUARE_ACCESS_TOKEN!);
    default:
      return new PlaceholderPaymentProvider();
  }
}
