import { Router } from "express";
import { sendSuccess } from "../common/helpers/send-success.js";
import {
  adminBookingRouter,
  publicBookingRouter,
} from "../modules/bookings/booking.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => sendSuccess(res, { status: "ok" }, "API is healthy"));
apiRouter.use("/bookings", publicBookingRouter);
apiRouter.use("/admin/bookings", adminBookingRouter);
