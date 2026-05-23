import { LemonSqueezyProvider } from "./lemonsqueezy";

export type SubscriptionStatus =
  | "free"
  | "trialing"
  | "active"
  | "canceled"
  | "past_due";

export type WebhookEvent =
  | {
      type: "subscription.created";
      userId: number;
      subscriptionId: string;
      externalCustomerId: string;
      status: SubscriptionStatus;
      trialEndsAt: Date | null;
    }
  | {
      type: "subscription.updated";
      subscriptionId: string;
      externalCustomerId: string;
      status: SubscriptionStatus;
      trialEndsAt: Date | null;
    }
  | {
      type: "subscription.canceled";
      subscriptionId: string;
    }
  | {
      type: "ignored";
      reason: string;
    };

export interface BillingProvider {
  createCheckoutSession(params: {
    userId: number;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }>;

  createPortalSession(params: {
    externalCustomerId: string;
    returnUrl: string;
  }): Promise<{ url: string }>;

  handleWebhook(rawBody: string, signature: string): Promise<WebhookEvent>;
}

let provider: BillingProvider | null = null;

export function getBillingProvider(): BillingProvider {
  if (provider) return provider;
  provider = new LemonSqueezyProvider();
  return provider;
}

// Test seam: allow tests to inject a fake provider.
export function setBillingProvider(p: BillingProvider | null): void {
  provider = p;
}
