import type { UserDocument } from "../models/user.model.js";
import type { SafeUser } from "../types/auth.types.js";

export const toSafeUser = (user: UserDocument): SafeUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isVerified: user.isVerified,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
