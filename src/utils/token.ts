import type { CookieOptions, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";
import { UserRole } from "../constants/roles.js";
import type { AuthTokenPayload } from "../types/auth.types.js";

export const AUTH_COOKIE_NAME = "washmate_token";

const signOptions: SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>,
};

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export const generateAuthToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, signOptions);

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  const payload = jwt.verify(token, env.JWT_SECRET);

  if (
    typeof payload === "string" ||
    typeof payload.userId !== "string" ||
    !Object.values(UserRole).includes(payload.role as UserRole)
  ) {
    throw new Error("Invalid authentication token payload");
  }

  return {
    userId: payload.userId,
    role: payload.role as UserRole,
  };
};

export const setAuthCookie = (response: Response, token: string): void => {
  response.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
};

export const clearAuthCookie = (response: Response): void => {
  response.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
};
