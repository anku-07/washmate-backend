import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { requestLogger } from "./middlewares/logger.middleware.js";
import authRouter from "./routes/auth.routes.js";
import healthRouter from "./routes/health.routes.js";
import userRouter from "./routes/user.routes.js";

const app = express();

// Security middleware
app.disable("x-powered-by");
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Logging
if (env.NODE_ENV === "development") {
  app.use(requestLogger);
}

// Routes
app.use("/api/v1", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);

// Error handling must be registered after all routes.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
