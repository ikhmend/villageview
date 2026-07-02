import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../../common/middleware/async-handler.js";
import { validate } from "../../common/middleware/validate.js";
import { bookingController } from "./booking.controller.js";
import {availabilityQuerySchema, bookingIdSchema, createAdminBookingSchema, createPublicBookingSchema, listBookingsQuerySchema, updateBookingSchema,} from "./booking.validation.js";
import { env } from "../../config/env.js";
const bookingLimiter = rateLimit({
  windowMs: env.BOOKING_RATE_LIMIT_WINDOW_MS,
  limit: env.BOOKING_RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "BOOKING_RATE_LIMITED", message: "Хэт олон захиалгын хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу." },
  },
});
export const publicBookingRouter = Router();
export const adminBookingRouter = Router();
publicBookingRouter.get("/availability", validate({ query: availabilityQuerySchema }), asyncHandler(bookingController.availability),);
publicBookingRouter.post("/", bookingLimiter, validate({ body: createPublicBookingSchema }), asyncHandler(bookingController.createPublic),);
publicBookingRouter.get("/:id/confirmation", validate({ params: bookingIdSchema }), asyncHandler(bookingController.confirmation),);
adminBookingRouter.get("/",validate({ query: listBookingsQuerySchema }), asyncHandler(bookingController.list),);
adminBookingRouter.get("/summary", asyncHandler(bookingController.summary));
adminBookingRouter.post("/", validate({ body: createAdminBookingSchema }), asyncHandler(bookingController.createAdmin),);
adminBookingRouter.patch("/:id", validate({ params: bookingIdSchema, body: updateBookingSchema }), asyncHandler(bookingController.update),);
adminBookingRouter.delete("/:id", validate({ params: bookingIdSchema }), asyncHandler(bookingController.remove),);
