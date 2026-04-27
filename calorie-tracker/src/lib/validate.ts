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
  image: z.string().min(10),
});
