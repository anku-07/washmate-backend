import { z } from "zod";

import { VehicleType } from "../constants/vehicle.js";

const requiredLabel = (label: string) =>
  z.string().trim().min(1, `${label} is required`).max(100);

const registrationNumberSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, "").toUpperCase())
  .pipe(
    z
      .string()
      .regex(
        /^[A-Z0-9]{6,15}$/,
        "Registration number must contain 6 to 15 letters or numbers",
      ),
  );

export const createVehicleSchema = z
  .object({
    type: z.enum(VehicleType),
    brand: requiredLabel("Brand"),
    model: requiredLabel("Model"),
    registrationNumber: registrationNumberSchema,
    color: requiredLabel("Color"),
  })
  .strict();

export const updateVehicleSchema = createVehicleSchema;

export const vehicleParamsSchema = z.object({
  vehicleId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Enter a valid vehicle ID"),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
