import { model, Schema, type HydratedDocument, type Types } from "mongoose";

import { VehicleType } from "../constants/vehicle.js";

export interface IVehicle {
  userId: Types.ObjectId;
  type: VehicleType;
  brand: string;
  model: string;
  registrationNumber: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type VehicleDocument = HydratedDocument<IVehicle>;

const vehicleSchema = new Schema<IVehicle>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    type: {
      type: String,
      enum: Object.values(VehicleType),
      required: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

vehicleSchema.index({ userId: 1, createdAt: -1 });
vehicleSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true },
    name: "one_default_vehicle_per_user",
  },
);

export const Vehicle = model<IVehicle>("Vehicle", vehicleSchema);
