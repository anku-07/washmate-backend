import type { RequestHandler } from "express";

import { User } from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "../utils/token.js";
import { toSafeUser } from "../utils/user.js";

export const authenticate: RequestHandler = async (request, _response, next) => {
  const token = request.cookies?.[AUTH_COOKIE_NAME] as string | undefined;

  if (!token) {
    throw new AppError("Unauthorized", 401);
  }

  let payload;

  try {
    payload = verifyAuthToken(token);
  } catch {
    throw new AppError("Unauthorized", 401);
  }

  const user = await User.findById(payload.userId);

  if (!user || !user.isActive) {
    throw new AppError("Unauthorized", 401);
  }

  request.user = toSafeUser(user);

  next();
};
