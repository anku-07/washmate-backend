import { Router } from "express";

import {
  changePassword,
  getProfile,
  updateProfile,
} from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "../validations/user.validation.js";

const userRouter = Router();

userRouter.use(authenticate);
userRouter.get("/me", getProfile);
userRouter.put("/me", validateBody(updateProfileSchema), updateProfile);
userRouter.patch(
  "/me/password",
  validateBody(changePasswordSchema),
  changePassword,
);

export default userRouter;
