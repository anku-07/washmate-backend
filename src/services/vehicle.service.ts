import mongoose from "mongoose";

import { Vehicle, type VehicleDocument } from "../models/vehicle.model.js";
import type { VehicleData } from "../types/vehicle.types.js";
import { AppError } from "../utils/app-error.js";
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
} from "../validations/vehicle.validation.js";

const toVehicleData = (vehicle: VehicleDocument): VehicleData => ({
  id: vehicle.id,
  type: vehicle.type,
  brand: vehicle.brand,
  model: vehicle.model,
  registrationNumber: vehicle.registrationNumber,
  color: vehicle.color,
  isDefault: vehicle.isDefault,
  createdAt: vehicle.createdAt,
  updatedAt: vehicle.updatedAt,
});

export const createVehicle = async (
  userId: string,
  input: CreateVehicleInput,
): Promise<VehicleData> => {
  const registrationExists = await Vehicle.exists({
    registrationNumber: input.registrationNumber,
  });

  if (registrationExists) {
    throw new AppError("Registration number is already in use", 409);
  }

  const hasAnotherVehicle = await Vehicle.exists({ userId });
  const vehicle = await Vehicle.create({
    ...input,
    userId,
    isDefault: !hasAnotherVehicle,
  });

  return toVehicleData(vehicle);
};

export const getUserVehicles = async (
  userId: string,
): Promise<VehicleData[]> => {
  const vehicles = await Vehicle.find({ userId }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  return vehicles.map(toVehicleData);
};

export const getUserVehicle = async (
  userId: string,
  vehicleId: string,
): Promise<VehicleData> => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, userId });

  if (!vehicle) {
    throw new AppError("Vehicle not found", 404);
  }

  return toVehicleData(vehicle);
};

export const updateUserVehicle = async (
  userId: string,
  vehicleId: string,
  input: UpdateVehicleInput,
): Promise<VehicleData> => {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, userId });

  if (!vehicle) {
    throw new AppError("Vehicle not found", 404);
  }

  const registrationExists = await Vehicle.exists({
    _id: { $ne: vehicle._id },
    registrationNumber: input.registrationNumber,
  });

  if (registrationExists) {
    throw new AppError("Registration number is already in use", 409);
  }

  vehicle.set(input);
  await vehicle.save();

  return toVehicleData(vehicle);
};

export const deleteUserVehicle = async (
  userId: string,
  vehicleId: string,
): Promise<void> => {
  await mongoose.connection.transaction(async (session) => {
    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId }).session(
      session,
    );

    if (!vehicle) {
      throw new AppError("Vehicle not found", 404);
    }

    // Add the active/upcoming booking check here when bookings are introduced.
    await vehicle.deleteOne({ session });

    if (vehicle.isDefault) {
      const nextVehicle = await Vehicle.findOne({ userId })
        .sort({ createdAt: 1 })
        .session(session);

      if (nextVehicle) {
        nextVehicle.isDefault = true;
        await nextVehicle.save({ session });
      }
    }
  });
};

export const setDefaultUserVehicle = async (
  userId: string,
  vehicleId: string,
): Promise<VehicleData> => {
  await mongoose.connection.transaction(async (session) => {
    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId }).session(
      session,
    );

    if (!vehicle) {
      throw new AppError("Vehicle not found", 404);
    }

    await Vehicle.updateMany(
      { userId, isDefault: true },
      { $set: { isDefault: false } },
      { session },
    );

    vehicle.isDefault = true;
    await vehicle.save({ session });
  });

  return getUserVehicle(userId, vehicleId);
};
