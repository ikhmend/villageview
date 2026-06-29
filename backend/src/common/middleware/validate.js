import { AppError } from "../errors/app-error.js";

export const validate = (schemas) => (req, _res, next) => {
  const validated = {};
  const errors = [];

  for (const location of ["params", "query", "body"]) {
    if (!schemas[location]) continue;
    const result = schemas[location].safeParse(req[location]);
    if (!result.success) {
      errors.push(...result.error.issues.map((issue) => ({
        location,
        path: issue.path.join("."),
        message: issue.message,
      })));
    } else {
      validated[location] = result.data;
    }
  }

  if (errors.length) {
    return next(new AppError("Input validation failed", {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      details: errors,
    }));
  }
  req.validated = validated;
  return next();
};
