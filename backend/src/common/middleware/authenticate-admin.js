import { UnauthorizedError } from "../errors/app-error.js";
import { authBusinessService } from "../../modules/auth/auth.business.service.js";
import { asyncHandler } from "./async-handler.js";

export const authenticateAdmin = asyncHandler(async (req, _res, next) => {
  const authorization = req.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new UnauthorizedError();
  const token = authorization.slice(7).trim();
  if (!token) throw new UnauthorizedError();
  req.admin = await authBusinessService.authenticateToken(token);
  next();
});
