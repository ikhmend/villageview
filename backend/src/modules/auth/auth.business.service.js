import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { ForbiddenError, UnauthorizedError } from "../../common/errors/app-error.js";
import { authCrudService } from "./auth.crud.service.js";

const tokenOptions = {
  expiresIn: env.JWT_EXPIRES_IN,
  issuer: "village-view-api",
  audience: "village-view-admin",
};
const dummyPasswordHash = bcrypt.hashSync("not-a-real-admin-password", 12);

export const authBusinessService = {
  async login({ email, password }) {
    const admin = await authCrudService.findByEmailWithPassword(email.toLowerCase());
    const passwordMatches = await bcrypt.compare(password, admin?.passwordHash || dummyPasswordHash);
    if (!admin || !passwordMatches) {
      throw new UnauthorizedError("Email or password is incorrect");
    }
    if (!admin.isActive) throw new ForbiddenError("Admin account is disabled");

    await authCrudService.update(admin, { lastLoginAt: new Date() });
    const token = jwt.sign({ role: "admin" }, env.JWT_SECRET, {
      ...tokenOptions,
      subject: admin.id,
    });

    return {
      token,
      expiresIn: env.JWT_EXPIRES_IN,
      admin: admin.toSafeJSON(),
    };
  },

  async authenticateToken(token) {
    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET, {
        issuer: tokenOptions.issuer,
        audience: tokenOptions.audience,
      });
    } catch {
      throw new UnauthorizedError("Token is invalid or expired");
    }

    if (payload.role !== "admin" || !payload.sub) throw new ForbiddenError();
    const admin = await authCrudService.findById(payload.sub);
    if (!admin || !admin.isActive) throw new UnauthorizedError("Admin account is unavailable");
    return admin;
  },
};
