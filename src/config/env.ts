import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65_535).default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  FRONTEND_URL: z.url().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),
});

export const env = envSchema.parse(process.env);
