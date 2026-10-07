import mongoose from "mongoose";

import { env } from "./env.js";

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.info("MongoDB connected");
  } catch (error: unknown) {
    console.error("❌ Database connection failed", error);
    throw error;
  }
};
