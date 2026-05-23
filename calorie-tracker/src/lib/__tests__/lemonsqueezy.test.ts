import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { LemonSqueezyProvider } from "../billing/lemonsqueezy";

const WEBHOOK_SECRET = "test-secret";

function sign(body: string): string {
  return createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
}

describe("LemonSqueezyProvider.handleWebhook", () => {
  const provider = new LemonSqueezyProvider();
  const originalSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  afterEach(() => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = originalSecret;
  });

  it("rejects an empty signature", async () => {
    const body = JSON.stringify({});
    await expect(provider.handleWebhook(body, "")).rejects.toThrow();
  });

  it("rejects a forged signature of the right length", async () => {
    const body = JSON.stringify({ meta: {}, data: {} });
    const wrong = "a".repeat(64);
    await expect(provider.handleWebhook(body, wrong)).rejects.toThrow(
      /signature/i
    );
  });

  it("rejects a signature of wrong length without throwing the comparator", async () => {
    const body = JSON.stringify({ meta: {}, data: {} });
    await expect(provider.handleWebhook(body, "ab")).rejects.toThrow(
      /signature/i
    );
  });

  it("throws when LEMONSQUEEZY_WEBHOOK_SECRET is missing", async () => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const body = JSON.stringify({});
    await expect(provider.handleWebhook(body, sign(body))).rejects.toThrow(
      /LEMONSQUEEZY_WEBHOOK_SECRET/
    );
  });

  it("maps subscription_created with userId in custom_data", async () => {
    const body = JSON.stringify({
      meta: {
        event_name: "subscription_created",
        custom_data: { userId: "42" },
      },
      data: {
        id: "sub_123",
        attributes: {
          customer_id: 999,
          status: "on_trial",
          trial_ends_at: "2026-06-01T00:00:00.000Z",
        },
      },
    });
    const event = await provider.handleWebhook(body, sign(body));
    expect(event.type).toBe("subscription.created");
    if (event.type === "subscription.created") {
      expect(event.userId).toBe(42);
      expect(event.subscriptionId).toBe("sub_123");
      expect(event.externalCustomerId).toBe("999");
      expect(event.status).toBe("trialing");
      expect(event.trialEndsAt?.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    }
  });

  it("ignores subscription_created without userId in custom_data", async () => {
    const body = JSON.stringify({
      meta: { event_name: "subscription_created", custom_data: {} },
      data: { id: "sub_1", attributes: { customer_id: 1, status: "active" } },
    });
    const event = await provider.handleWebhook(body, sign(body));
    expect(event.type).toBe("ignored");
  });

  it("maps subscription_updated to subscription.updated", async () => {
    const body = JSON.stringify({
      meta: { event_name: "subscription_updated" },
      data: {
        id: "sub_1",
        attributes: { customer_id: 99, status: "active", trial_ends_at: null },
      },
    });
    const event = await provider.handleWebhook(body, sign(body));
    expect(event.type).toBe("subscription.updated");
    if (event.type === "subscription.updated") {
      expect(event.externalCustomerId).toBe("99");
      expect(event.status).toBe("active");
      expect(event.trialEndsAt).toBeNull();
    }
  });

  it("maps subscription_cancelled to subscription.canceled", async () => {
    const body = JSON.stringify({
      meta: { event_name: "subscription_cancelled" },
      data: { id: "sub_7", attributes: { status: "cancelled" } },
    });
    const event = await provider.handleWebhook(body, sign(body));
    expect(event.type).toBe("subscription.canceled");
    if (event.type === "subscription.canceled") {
      expect(event.subscriptionId).toBe("sub_7");
    }
  });

  it("ignores unknown event types", async () => {
    const body = JSON.stringify({
      meta: { event_name: "order_created" },
      data: { id: "order_1", attributes: {} },
    });
    const event = await provider.handleWebhook(body, sign(body));
    expect(event.type).toBe("ignored");
  });

  it("maps past_due correctly", async () => {
    const body = JSON.stringify({
      meta: { event_name: "subscription_updated" },
      data: {
        id: "sub_1",
        attributes: { customer_id: 1, status: "past_due", trial_ends_at: null },
      },
    });
    const event = await provider.handleWebhook(body, sign(body));
    if (event.type === "subscription.updated") {
      expect(event.status).toBe("past_due");
    } else {
      throw new Error(`unexpected event type ${event.type}`);
    }
  });
});
