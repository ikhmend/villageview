export class AppError extends Error {
  constructor(message, { statusCode = 500, code = "INTERNAL_ERROR", details = null } = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, { statusCode: 404, code: "NOT_FOUND" });
  }
}

export class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, { statusCode: 409, code: "CONFLICT", details });
  }
}
