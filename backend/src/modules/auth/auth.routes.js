import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../../common/middleware/async-handler.js";
import { authenticateAdmin } from "../../common/middleware/authenticate-admin.js";
import { validate } from "../../common/middleware/validate.js";
import { authController } from "./auth.controller.js";
import {forgotPasswordSchema, loginSchema, resetPasswordSchema,} from "./auth.validation.js";

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
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RESET_RATE_LIMITED", message: "Too many reset requests. Try again later." },
  },
});
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: { code: "RESET_RATE_LIMITED", message: "Too many reset attempts. Try again later." },
  },
});
export const authRouter = Router();
authRouter.post(
  "/login",
  loginLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);
authRouter.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate({ body: forgotPasswordSchema }),
  asyncHandler(authController.forgotPassword),
);
authRouter.post(
  "/reset-password",
  resetPasswordLimiter,
  validate({ body: resetPasswordSchema }),
  asyncHandler(authController.resetPassword),
);
authRouter.get("/me", authenticateAdmin, asyncHandler(authController.me));
