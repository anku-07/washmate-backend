import { Router } from "express";

const v1Router = Router();

v1Router.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "WashMate API is healthy",
  });
});

export default v1Router;
