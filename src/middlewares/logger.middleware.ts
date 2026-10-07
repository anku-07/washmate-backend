import type { RequestHandler } from "express";

export const requestLogger: RequestHandler = (request, response, next) => {
  const startedAt = performance.now();

  response.on("finish", () => {
    const duration = (performance.now() - startedAt).toFixed(1);
    console.info(
      `${request.method} ${request.originalUrl} ${response.statusCode} ${duration}ms`,
    );
  });

  next();
};
