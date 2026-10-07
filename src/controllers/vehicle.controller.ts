import type { RequestHandler } from "express";

import {
  createVehicle,
  deleteUserVehicle,
  getUserVehicle,
  getUserVehicles,
  setDefaultUserVehicle,
  updateUserVehicle,
} from "../services/vehicle.service.js";
import { AppError } from "../utils/app-error.js";
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
} from "../validations/vehicle.validation.js";

const getUserId = (userId: string | undefined): string => {
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  return userId;
};

const getVehicleId = (
  vehicleId: string | string[] | undefined,
): string => {
  if (!vehicleId || Array.isArray(vehicleId)) {
    throw new AppError("Vehicle ID is required", 400);
  }

  return vehicleId;
};

export const addVehicle: RequestHandler = async (request, response) => {
  const vehicle = await createVehicle(
    getUserId(request.user?.id),
    request.body as CreateVehicleInput,
  );

  response.status(201).json({ success: true, data: vehicle });
};

export const getVehicles: RequestHandler = async (request, response) => {
  const vehicles = await getUserVehicles(getUserId(request.user?.id));
  response.status(200).json({ success: true, data: vehicles });
};

export const getVehicle: RequestHandler = async (request, response) => {
  const vehicle = await getUserVehicle(
    getUserId(request.user?.id),
    getVehicleId(request.params.vehicleId),
  );

  response.status(200).json({ success: true, data: vehicle });
};

export const updateVehicle: RequestHandler = async (request, response) => {
  const vehicle = await updateUserVehicle(
    getUserId(request.user?.id),
    getVehicleId(request.params.vehicleId),
    request.body as UpdateVehicleInput,
  );

  response.status(200).json({ success: true, data: vehicle });
};

export const deleteVehicle: RequestHandler = async (request, response) => {
  await deleteUserVehicle(
    getUserId(request.user?.id),
    getVehicleId(request.params.vehicleId),
  );

  response.status(200).json({
    success: true,
    message: "Vehicle deleted successfully",
  });
};

export const setDefaultVehicle: RequestHandler = async (request, response) => {
  const vehicle = await setDefaultUserVehicle(
    getUserId(request.user?.id),
    getVehicleId(request.params.vehicleId),
  );

  response.status(200).json({ success: true, data: vehicle });
};
