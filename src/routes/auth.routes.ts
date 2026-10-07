import { Router } from "express";

import {
  getCurrentUser,
  login,
  logout,
  register,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  loginSchema,
  registerSchema,
} from "../validations/auth.validation.js";

const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/logout", logout);
authRouter.get("/me", authenticate, getCurrentUser);

export default authRouter;
