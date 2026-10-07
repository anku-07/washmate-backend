import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().toLowerCase(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone number"),
    password: z.string().min(8).max(72),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1).max(72),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
