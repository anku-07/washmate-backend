import { Router } from "express";

const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "WashMate API is healthy",
  });
});

export default healthRouter;
