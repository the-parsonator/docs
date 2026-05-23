import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  BillingProvider,
  SubscriptionStatus,
  WebhookEvent,
} from "./index";

const API_BASE = "https://api.lemonsqueezy.com/v1";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not set`);
  return value;
}

// Map LemonSqueezy subscription `status` strings → our normalized statuses.
// Reference: https://docs.lemonsqueezy.com/api/subscriptions
function mapStatus(status: unknown): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "on_trial":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "cancelled":
    case "expired":
    case "paused":
      return "canceled";
    default:
      return "free";
  }
}

export class LemonSqueezyProvider implements BillingProvider {
  async createCheckoutSession(params: {
    userId: number;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }> {
    const apiKey = requireEnv("LEMONSQUEEZY_API_KEY");
    const storeId = requireEnv("LEMONSQUEEZY_STORE_ID");

    const res = await fetch(`${API_BASE}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            // `custom` survives across webhook events for this subscription —
            // we use it to map the LemonSqueezy customer back to our user.
            checkout_data: { custom: { userId: String(params.userId) } },
            product_options: { redirect_url: params.successUrl },
          },
          relationships: {
            store: { data: { type: "stores", id: storeId } },
            variant: { data: { type: "variants", id: params.priceId } },
          },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`LemonSqueezy checkout failed: ${res.status} ${body}`);
    }

    const json = (await res.json()) as {
      data?: { attributes?: { url?: string } };
    };
    const url = json.data?.attributes?.url;
    if (!url) throw new Error("LemonSqueezy did not return a checkout URL");
    return { url };
  }

  async createPortalSession(params: {
    externalCustomerId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    const apiKey = requireEnv("LEMONSQUEEZY_API_KEY");

    const res = await fetch(
      `${API_BASE}/customers/${encodeURIComponent(params.externalCustomerId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.api+json",
        },
      }
    );
    if (!res.ok) {
      throw new Error(`LemonSqueezy customer fetch failed: ${res.status}`);
    }

    const json = (await res.json()) as {
      data?: { attributes?: { urls?: { customer_portal?: string } } };
    };
    const url = json.data?.attributes?.urls?.customer_portal;
    if (!url) throw new Error("LemonSqueezy did not return a portal URL");
    return { url };
  }

  async handleWebhook(rawBody: string, signature: string): Promise<WebhookEvent> {
    const secret = requireEnv("LEMONSQUEEZY_WEBHOOK_SECRET");
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

    if (!signature) throw new Error("Missing signature header");
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) {
      throw new Error("Invalid webhook signature");
    }
    if (!timingSafeEqual(sigBuf, expBuf)) {
      throw new Error("Invalid webhook signature");
    }

    const payload = JSON.parse(rawBody) as {
      meta?: { event_name?: string; custom_data?: { userId?: string } };
      data?: {
        id?: string;
        attributes?: {
          customer_id?: string | number;
          status?: string;
          trial_ends_at?: string | null;
        };
      };
    };
    const eventName = payload.meta?.event_name ?? "";
    const userIdRaw = payload.meta?.custom_data?.userId;
    const userId = userIdRaw ? parseInt(userIdRaw, 10) : NaN;

    const attrs = payload.data?.attributes ?? {};
    const subscriptionId = String(payload.data?.id ?? "");
    const externalCustomerId = String(attrs.customer_id ?? "");
    const status = mapStatus(attrs.status);
    const trialEndsAt = attrs.trial_ends_at
      ? new Date(attrs.trial_ends_at)
      : null;

    switch (eventName) {
      case "subscription_created":
        if (!Number.isInteger(userId)) {
          return { type: "ignored", reason: "missing userId in custom_data" };
        }
        if (!subscriptionId || !externalCustomerId) {
          return { type: "ignored", reason: "missing ids on subscription_created" };
        }
        return {
          type: "subscription.created",
          userId,
          subscriptionId,
          externalCustomerId,
          status,
          trialEndsAt,
        };

      case "subscription_updated":
      case "subscription_resumed":
      case "subscription_unpaused":
        if (!externalCustomerId) {
          return { type: "ignored", reason: "missing customer id" };
        }
        return {
          type: "subscription.updated",
          subscriptionId,
          externalCustomerId,
          status,
          trialEndsAt,
        };

      case "subscription_cancelled":
      case "subscription_expired":
      case "subscription_paused":
        return { type: "subscription.canceled", subscriptionId };

      default:
        return { type: "ignored", reason: `unhandled event: ${eventName}` };
    }
  }
}
