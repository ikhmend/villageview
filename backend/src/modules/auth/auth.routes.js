import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../../common/middleware/async-handler.js";
import { authenticateAdmin } from "../../common/middleware/authenticate-admin.js";
import { validate } from "../../common/middleware/validate.js";
import { authController } from "./auth.controller.js";
import { loginSchema } from "./auth.validation.js";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: { code: "LOGIN_RATE_LIMITED", message: "Хэт олон удаа оролдлоо. Хэсэг хугацааны дараа дахин нэвтэрнэ үү." },
  },
});

export const authRouter = Router();

authRouter.post(
  "/login",
  loginLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);
authRouter.get("/me", authenticateAdmin, asyncHandler(authController.me));
