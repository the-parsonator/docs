import { describe, it, expect } from "vitest";
import { generateResetToken, hashResetToken, RESET_TOKEN_TTL_MS } from "../reset-token";

describe("generateResetToken", () => {
  it("returns a 64-char hex raw token and matching sha256 hash", () => {
    const { raw, hash } = generateResetToken();
    expect(raw).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe(hashResetToken(raw));
  });

  it("returns unique tokens across calls", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });
});

describe("hashResetToken", () => {
  it("is deterministic", () => {
    const raw = "deadbeef".repeat(8);
    expect(hashResetToken(raw)).toBe(hashResetToken(raw));
  });

  it("differs for different inputs", () => {
    expect(hashResetToken("aaa")).not.toBe(hashResetToken("aab"));
  });
});

describe("RESET_TOKEN_TTL_MS", () => {
  it("is one hour", () => {
    expect(RESET_TOKEN_TTL_MS).toBe(60 * 60 * 1000);
  });
});
