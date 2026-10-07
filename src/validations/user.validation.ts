import { z } from "zod";

const nameSchema = z.string().trim().min(2).max(100);
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone number");

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
  })
  .strict()
  .refine((data) => data.name !== undefined || data.phone !== undefined, {
    message: "Provide a name or phone number to update",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(72),
    newPassword: z.string().min(8).max(72),
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
