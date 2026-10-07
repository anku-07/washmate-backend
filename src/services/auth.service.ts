import { UserRole } from "../constants/roles.js";
import { User } from "../models/user.model.js";
import type { SafeUser } from "../types/auth.types.js";
import { AppError } from "../utils/app-error.js";
import { comparePassword } from "../utils/password.js";
import { generateAuthToken } from "../utils/token.js";
import { toSafeUser } from "../utils/user.js";
import type {
  LoginInput,
  RegisterInput,
} from "../validations/auth.validation.js";

interface AuthResult {
  token: string;
  user: SafeUser;
}

export const registerUser = async (input: RegisterInput): Promise<AuthResult> => {
  const emailExists = await User.exists({ email: input.email });

  if (emailExists) {
    throw new AppError("Email is already registered", 409);
  }

  const user = await User.create({
    ...input,
    role: UserRole.CUSTOMER,
  });

  return {
    token: generateAuthToken({ userId: user.id, role: user.role }),
    user: toSafeUser(user),
  };
};

export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const user = await User.findOne({ email: input.email }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await comparePassword(input.password, user.password);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is inactive", 403);
  }

  return {
    token: generateAuthToken({ userId: user.id, role: user.role }),
    user: toSafeUser(user),
  };
};
