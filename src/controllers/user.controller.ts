import type { RequestHandler } from "express";

import {
  changeUserPassword,
  getUserProfile,
  updateUserProfile,
} from "../services/user.service.js";
import { AppError } from "../utils/app-error.js";
import type {
  ChangePasswordInput,
  UpdateProfileInput,
} from "../validations/user.validation.js";

const getAuthenticatedUserId = (userId: string | undefined): string => {
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  return userId;
};

export const getProfile: RequestHandler = async (request, response) => {
  const userId = getAuthenticatedUserId(request.user?.id);
  const user = await getUserProfile(userId);

  response.status(200).json({
    success: true,
    data: user,
  });
};

export const updateProfile: RequestHandler = async (request, response) => {
  const userId = getAuthenticatedUserId(request.user?.id);
  const user = await updateUserProfile(
    userId,
    request.body as UpdateProfileInput,
  );

  response.status(200).json({
    success: true,
    data: user,
  });
};

export const changePassword: RequestHandler = async (request, response) => {
  const userId = getAuthenticatedUserId(request.user?.id);
  await changeUserPassword(userId, request.body as ChangePasswordInput);

  response.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
};
