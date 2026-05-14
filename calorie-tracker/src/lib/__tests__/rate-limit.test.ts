import { describe, it, expect, beforeEach, vi } from "vitest";

// Isolate module between tests so the Map resets
beforeEach(() => {
  vi.resetModules();
});

describe("inMemoryRateLimit (no Upstash env)", () => {
  it("allows requests up to the limit", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { rateLimit } = await import("../rate-limit");
    const results = await Promise.all(
      Array.from({ length: 5 }, () => rateLimit("1.2.3.4"))
    );
    expect(results.every(Boolean)).toBe(true);
  });

  it("blocks the 6th request within the window", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { rateLimit } = await import("../rate-limit");
    for (let i = 0; i < 5; i++) await rateLimit("2.2.2.2");
    const blocked = await rateLimit("2.2.2.2");
    expect(blocked).toBe(false);
  });

  it("uses separate buckets per IP", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { rateLimit } = await import("../rate-limit");
    for (let i = 0; i < 5; i++) await rateLimit("3.3.3.3");
    // Different IP should still be allowed
    expect(await rateLimit("4.4.4.4")).toBe(true);
  });
});
