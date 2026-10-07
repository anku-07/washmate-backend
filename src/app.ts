import cors from "cors";
import express from "express";
import helmet from "helmet";

import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { requestLogger } from "./middlewares/logger.middleware.js";
import v1Router from "./routes/v1/index.js";

const app = express();

// Security middleware
app.disable("x-powered-by");
app.use(helmet());

// CORS
app.use(cors());

// Body parsing
app.use(express.json({ limit: "10kb" }));

// Logging
app.use(requestLogger);

// Routes
app.use("/api/v1", v1Router);

// Error handling must be registered after all routes.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
