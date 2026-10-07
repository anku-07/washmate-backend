import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65_535).default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
});

export const env = envSchema.parse(process.env);
