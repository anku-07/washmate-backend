import type { ErrorRequestHandler, RequestHandler } from "express";

import { AppError } from "../utils/app-error.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(
    new AppError(
      `Route ${request.method} ${request.originalUrl} not found`,
      404,
    ),
  );
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const isOperationalError = error instanceof AppError;
  const statusCode = isOperationalError ? error.statusCode : 500;
  const message = isOperationalError ? error.message : "Something went wrong";

  console.error(error);
  response.status(statusCode).json({
    success: false,
    message,
  });
};
