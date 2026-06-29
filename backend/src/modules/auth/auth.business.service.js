import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sequelize } from "../../config/database.js";
import { env } from "../../config/env.js";
import { AppError, ForbiddenError, UnauthorizedError } from "../../common/errors/app-error.js";
import { emailService } from "../../common/services/email.service.js";
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
    const token = jwt.sign({ role: "admin", tokenVersion: admin.tokenVersion }, env.JWT_SECRET, {
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
    if (!admin || !admin.isActive || payload.tokenVersion !== admin.tokenVersion) {
      throw new UnauthorizedError("Admin session is no longer valid");
    }
    return admin;
  },

  async requestPasswordReset({ email }) {
    const normalizedEmail = email.toLowerCase();
    const reset = await sequelize.transaction(async (transaction) => {
      const admin = await authCrudService.findByEmail(normalizedEmail, transaction);
      if (!admin?.isActive) return null;

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
      await authCrudService.invalidateResetTokens(admin.id, transaction);
      await authCrudService.createResetToken({ adminUserId: admin.id, tokenHash, expiresAt }, transaction);
      return { admin, rawToken };
    });

    if (reset) {
      const resetUrl = `${env.CLIENT_ORIGIN.split(",")[0].replace(/\/$/, "")}/admin/reset-password?token=${encodeURIComponent(reset.rawToken)}`;
      try {
        await emailService.sendPasswordReset({
          email: reset.admin.email,
          name: reset.admin.name,
          resetUrl,
          expiresInMinutes: env.PASSWORD_RESET_TTL_MINUTES,
        });
      } catch (error) {
        console.error("Unable to send password reset email", error);
        await sequelize.transaction((transaction) =>
          authCrudService.invalidateResetTokens(reset.admin.id, transaction));
      }
    }

    return { accepted: true };
  },

  resetPassword({ token, password }) {
    return sequelize.transaction(async (transaction) => {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const resetToken = await authCrudService.findValidResetToken(tokenHash, transaction);
      if (!resetToken) {
        throw new AppError("Reset link is invalid or expired", {
          statusCode: 400,
          code: "INVALID_RESET_TOKEN",
        });
      }

      const admin = await authCrudService.findById(resetToken.adminUserId, transaction);
      if (!admin?.isActive) throw new AppError("Reset link is invalid or expired", {
        statusCode: 400,
        code: "INVALID_RESET_TOKEN",
      });

      const passwordHash = await bcrypt.hash(password, 12);
      await authCrudService.update(admin, {
        passwordHash,
        tokenVersion: admin.tokenVersion + 1,
      }, transaction);
      await authCrudService.invalidateResetTokens(admin.id, transaction);
      return { reset: true };
    });
  },
};
