import type { RequestHandler } from "express";

import { loginUser, registerUser } from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";
import { clearAuthCookie, setAuthCookie } from "../utils/token.js";
import type {
  LoginInput,
  RegisterInput,
} from "../validations/auth.validation.js";

export const register: RequestHandler = async (request, response) => {
  const result = await registerUser(request.body as RegisterInput);
  setAuthCookie(response, result.token);

  response.status(201).json({
    success: true,
    data: result.user,
  });
};

export const login: RequestHandler = async (request, response) => {
  const result = await loginUser(request.body as LoginInput);
  setAuthCookie(response, result.token);

  response.status(200).json({
    success: true,
    data: result.user,
  });
};

export const getCurrentUser: RequestHandler = (request, response) => {
  if (!request.user) {
    throw new AppError("Unauthorized", 401);
  }

  response.status(200).json({
    success: true,
    data: request.user,
  });
};

export const logout: RequestHandler = (_request, response) => {
  clearAuthCookie(response);
  response.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
