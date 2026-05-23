import { z } from "zod";

export const AuthSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const FoodEntrySchema = z.object({
  name: z.string().min(1).max(200),
  calories: z.coerce.number().int().positive().max(10000),
});

export const UpdateTargetSchema = z.object({
  calorieTarget: z.coerce.number().int().positive().max(10000),
});

export const FoodPhotoSchema = z.object({
  image: z.string().min(10).max(2_000_000), // ~1.5 MB decoded
});

export const ClaudePhotoResponseSchema = z.object({
  name: z.string().min(1).max(200),
  calories: z.coerce.number().int().positive().max(10000),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase()),
});

export const ResetPasswordSchema = z.object({
  // Raw reset token: 32 bytes encoded as hex = 64 chars
  token: z.string().length(64).regex(/^[a-f0-9]+$/),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const CheckoutSchema = z.object({
  priceId: z.string().min(1).max(100),
});
