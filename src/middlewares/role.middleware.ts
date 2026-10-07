import type { RequestHandler } from "express";

import type { UserRole } from "../constants/roles.js";
import { AppError } from "../utils/app-error.js";

export const requireRole = (...allowedRoles: UserRole[]): RequestHandler =>
  (request, _response, next) => {
    if (!request.user) {
      throw new AppError("Unauthorized", 401);
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new AppError("Forbidden", 403);
    }

    next();
  };
