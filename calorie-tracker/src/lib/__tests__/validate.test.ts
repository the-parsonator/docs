import { describe, it, expect } from "vitest";
import {
  AuthSchema,
  FoodEntrySchema,
  UpdateTargetSchema,
  FoodPhotoSchema,
  ClaudePhotoResponseSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "../validate";

describe("AuthSchema", () => {
  it("accepts valid credentials", () => {
    const r = AuthSchema.safeParse({ email: "Test@Example.COM", password: "password123" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("test@example.com"); // lowercased
  });
  it("rejects invalid email", () => {
    expect(AuthSchema.safeParse({ email: "notanemail", password: "password123" }).success).toBe(false);
  });
  it("rejects short password", () => {
    expect(AuthSchema.safeParse({ email: "a@b.com", password: "short" }).success).toBe(false);
  });
});

describe("FoodEntrySchema", () => {
  it("accepts valid entry", () => {
    expect(FoodEntrySchema.safeParse({ name: "Apple", calories: 95 }).success).toBe(true);
  });
  it("coerces string calories", () => {
    const r = FoodEntrySchema.safeParse({ name: "Apple", calories: "95" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.calories).toBe(95);
  });
  it("rejects empty name", () => {
    expect(FoodEntrySchema.safeParse({ name: "", calories: 95 }).success).toBe(false);
  });
  it("rejects name over 200 chars", () => {
    expect(FoodEntrySchema.safeParse({ name: "a".repeat(201), calories: 95 }).success).toBe(false);
  });
  it("rejects zero calories", () => {
    expect(FoodEntrySchema.safeParse({ name: "Apple", calories: 0 }).success).toBe(false);
  });
  it("rejects negative calories", () => {
    expect(FoodEntrySchema.safeParse({ name: "Apple", calories: -1 }).success).toBe(false);
  });
  it("rejects calories over 10000", () => {
    expect(FoodEntrySchema.safeParse({ name: "Apple", calories: 10001 }).success).toBe(false);
  });
});

describe("UpdateTargetSchema", () => {
  it("accepts valid target", () => {
    expect(UpdateTargetSchema.safeParse({ calorieTarget: 2000 }).success).toBe(true);
  });
  it("rejects zero target", () => {
    expect(UpdateTargetSchema.safeParse({ calorieTarget: 0 }).success).toBe(false);
  });
});

describe("FoodPhotoSchema", () => {
  it("rejects oversized image", () => {
    expect(FoodPhotoSchema.safeParse({ image: "a".repeat(2_000_001) }).success).toBe(false);
  });
  it("rejects too-short image", () => {
    expect(FoodPhotoSchema.safeParse({ image: "short" }).success).toBe(false);
  });
});

describe("ClaudePhotoResponseSchema", () => {
  it("accepts valid response", () => {
    const r = ClaudePhotoResponseSchema.safeParse({ name: "Pizza", calories: 800 });
    expect(r.success).toBe(true);
  });
  it("rejects negative calories", () => {
    expect(ClaudePhotoResponseSchema.safeParse({ name: "Pizza", calories: -1 }).success).toBe(false);
  });
  it("rejects unreasonably high calories", () => {
    expect(ClaudePhotoResponseSchema.safeParse({ name: "Pizza", calories: 99999 }).success).toBe(false);
  });
});

describe("ForgotPasswordSchema", () => {
  it("lowercases the email", () => {
    const r = ForgotPasswordSchema.safeParse({ email: "Foo@BAR.com" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("foo@bar.com");
  });
  it("rejects invalid email", () => {
    expect(ForgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("ResetPasswordSchema", () => {
  const validToken = "a".repeat(64);
  it("accepts a 64-char hex token + 8+ char password", () => {
    expect(ResetPasswordSchema.safeParse({ token: validToken, password: "password123" }).success).toBe(true);
  });
  it("rejects a token of wrong length", () => {
    expect(ResetPasswordSchema.safeParse({ token: "a".repeat(63), password: "password123" }).success).toBe(false);
  });
  it("rejects a non-hex token", () => {
    expect(ResetPasswordSchema.safeParse({ token: "z".repeat(64), password: "password123" }).success).toBe(false);
  });
  it("rejects a short password", () => {
    expect(ResetPasswordSchema.safeParse({ token: validToken, password: "short" }).success).toBe(false);
  });
});
