import { Router } from "express";

const router = Router();

router.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "WashMate API is healthy",
  });
});

export default router;
