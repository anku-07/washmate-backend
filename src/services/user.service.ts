import { User } from "../models/user.model.js";
import type { SafeUser } from "../types/auth.types.js";
import { AppError } from "../utils/app-error.js";
import { comparePassword } from "../utils/password.js";
import { toSafeUser } from "../utils/user.js";
import type {
  ChangePasswordInput,
  UpdateProfileInput,
} from "../validations/user.validation.js";

export const getUserProfile = async (userId: string): Promise<SafeUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return toSafeUser(user);
};

export const updateUserProfile = async (
  userId: string,
  input: UpdateProfileInput,
): Promise<SafeUser> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: input },
    { returnDocument: "after", runValidators: true },
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return toSafeUser(user);
};

export const changeUserPassword = async (
  userId: string,
  input: ChangePasswordInput,
): Promise<void> => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const passwordMatches = await comparePassword(
    input.currentPassword,
    user.password,
  );

  if (!passwordMatches) {
    throw new AppError("Current password is incorrect", 401);
  }

  user.password = input.newPassword;
  await user.save();
};
