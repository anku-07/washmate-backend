import type { VehicleType } from "../constants/vehicle.js";

export interface VehicleData {
  id: string;
  type: VehicleType;
  brand: string;
  model: string;
  registrationNumber: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
