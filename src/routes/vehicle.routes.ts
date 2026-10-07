import { Router } from "express";

import { UserRole } from "../constants/roles.js";
import {
  addVehicle,
  deleteVehicle,
  getVehicle,
  getVehicles,
  setDefaultVehicle,
  updateVehicle,
} from "../controllers/vehicle.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  validateBody,
  validateParams,
} from "../middlewares/validate.middleware.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleParamsSchema,
} from "../validations/vehicle.validation.js";

const vehicleRouter = Router();

vehicleRouter.use(authenticate, requireRole(UserRole.CUSTOMER));
vehicleRouter.post("/", validateBody(createVehicleSchema), addVehicle);
vehicleRouter.get("/", getVehicles);
vehicleRouter.get(
  "/:vehicleId",
  validateParams(vehicleParamsSchema),
  getVehicle,
);
vehicleRouter.put(
  "/:vehicleId",
  validateParams(vehicleParamsSchema),
  validateBody(updateVehicleSchema),
  updateVehicle,
);
vehicleRouter.delete(
  "/:vehicleId",
  validateParams(vehicleParamsSchema),
  deleteVehicle,
);
vehicleRouter.patch(
  "/:vehicleId/default",
  validateParams(vehicleParamsSchema),
  setDefaultVehicle,
);

export default vehicleRouter;
