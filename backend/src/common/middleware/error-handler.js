import { DatabaseError, UniqueConstraintError, ValidationError } from "sequelize";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";

export function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, {
    statusCode: 404,
    code: "ROUTE_NOT_FOUND",
  }));
}

export function errorHandler(error, req, res, _next) {
  let normalized = error;
  if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
    normalized = new AppError("Database validation failed", {
      statusCode: 400,
      code: "DATABASE_VALIDATION_ERROR",
      details: error.errors?.map((item) => ({ path: item.path, message: item.message })),
    });
  } else if (error instanceof DatabaseError && [
    "bookings_no_confirmed_overlap",
    "bookings_no_active_overlap",
  ].includes(error.parent?.constraint)) {
    normalized = new AppError("The selected dates are already booked", {
      statusCode: 409,
      code: "BOOKING_DATE_CONFLICT",
    });
  } else if (!(error instanceof AppError)) {
    normalized = new AppError("Internal server error");
  }
  if (normalized.statusCode >= 500) {
    console.error({
      requestId: req.id,
      error: error.stack || error.message,
    });
  }
  const payload = {
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details ? { details: normalized.details } : {}),
      ...(req.id ? { requestId: req.id } : {}),
    },
  };

  if (env.NODE_ENV !== "production" && normalized.statusCode >= 500) {
    payload.error.stack = error.stack;
  }

  res.status(normalized.statusCode).json(payload);
}
