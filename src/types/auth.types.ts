import type { UserRole } from "../constants/roles.js";

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}
