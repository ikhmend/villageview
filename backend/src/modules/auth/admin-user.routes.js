import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../../common/middleware/async-handler.js";
import { validate } from "../../common/middleware/validate.js";
import { authController } from "./auth.controller.js";
import {adminIdSchema, inviteAdminSchema, listAdminsQuerySchema, updateAdminSchema,} from "./auth.validation.js";
const invitationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "INVITATION_RATE_LIMITED", message: "Too many invitations. Try again later." },
  },
});
export const adminUserRouter = Router();
adminUserRouter.get(
  "/",
  validate({ query: listAdminsQuerySchema }),
  asyncHandler(authController.listAdmins),
);
adminUserRouter.post(
  "/invitations",
  invitationLimiter,
  validate({ body: inviteAdminSchema }),
  asyncHandler(authController.inviteAdmin),
);
adminUserRouter.post(
  "/:id/invitations",
  invitationLimiter,
  validate({ params: adminIdSchema }),
  asyncHandler(authController.resendAdminInvitation),
);
adminUserRouter.patch(
  "/:id",
  validate({ params: adminIdSchema, body: updateAdminSchema }),
  asyncHandler(authController.updateAdmin),
);
adminUserRouter.delete(
  "/:id/invitation",
  validate({ params: adminIdSchema }),
  asyncHandler(authController.cancelAdminInvitation),
);
