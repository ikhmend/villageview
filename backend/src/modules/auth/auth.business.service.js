import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sequelize } from "../../config/database.js";
import { env } from "../../config/env.js";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../common/errors/app-error.js";
import { emailService } from "../../common/services/email.service.js";
import { authCrudService } from "./auth.crud.service.js";

const tokenOptions = {
  expiresIn: env.JWT_EXPIRES_IN,
  issuer: "village-view-api",
  audience: "village-view-admin",
};
const dummyPasswordHash = bcrypt.hashSync("not-a-real-admin-password", 12);

function createOneTimeToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  return {
    rawToken,
    tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
    expiresAt: new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60 * 1000),
  };
}

function clientUrl(path) {
  return `${env.CLIENT_ORIGIN.split(",")[0].trim().replace(/\/$/, "")}${path}`;
}

async function invalidateTokenAfterEmailFailure(adminUserId) {
  await sequelize.transaction((transaction) =>
    authCrudService.invalidateResetTokens(adminUserId, transaction));
}

async function sendInvitationEmail(admin, rawToken, inviter) {
  const invitationUrl = clientUrl(`/admin/reset-password?token=${encodeURIComponent(rawToken)}&invite=1`);
  try {
    await emailService.sendAdminInvitation({
      email: admin.email,
      name: admin.name,
      invitationUrl,
      expiresInMinutes: env.PASSWORD_RESET_TTL_MINUTES,
      inviterName: inviter.name,
    });
  } catch (error) {
    console.error("Unable to send administrator invitation", error);
    await invalidateTokenAfterEmailFailure(admin.id);
    throw new AppError("Unable to send the invitation email", {
      statusCode: 502,
      code: "INVITATION_EMAIL_FAILED",
    });
  }
}

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

      const { rawToken, tokenHash, expiresAt } = createOneTimeToken();
      await authCrudService.invalidateResetTokens(admin.id, transaction);
      await authCrudService.createResetToken({ adminUserId: admin.id, tokenHash, expiresAt }, transaction);
      return { admin, rawToken };
    });

    if (reset) {
      const resetUrl = clientUrl(`/admin/reset-password?token=${encodeURIComponent(reset.rawToken)}`);
      try {
        await emailService.sendPasswordReset({
          email: reset.admin.email,
          name: reset.admin.name,
          resetUrl,
          expiresInMinutes: env.PASSWORD_RESET_TTL_MINUTES,
        });
      } catch (error) {
        console.error("Unable to send password reset email", error);
        await invalidateTokenAfterEmailFailure(reset.admin.id);
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
      const isPendingInvitation = admin && !admin.invitationAcceptedAt;
      if (!admin || (!admin.isActive && !isPendingInvitation)) throw new AppError("Reset link is invalid or expired", {
        statusCode: 400,
        code: "INVALID_RESET_TOKEN",
      });

      const passwordHash = await bcrypt.hash(password, 12);
      await authCrudService.update(admin, {
        passwordHash,
        tokenVersion: admin.tokenVersion + 1,
        ...(isPendingInvitation ? { isActive: true, invitationAcceptedAt: new Date() } : {}),
      }, transaction);
      await authCrudService.invalidateResetTokens(admin.id, transaction);
      return { reset: true, invitationAccepted: isPendingInvitation };
    });
  },

  async listAdmins() {
    const admins = await authCrudService.listAdmins();
    return admins.map((admin) => admin.toSafeJSON());
  },

  async inviteAdmin({ name, email }, inviter) {
    const normalizedEmail = email.toLowerCase();
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
    const invitation = await sequelize.transaction(async (transaction) => {
      if (await authCrudService.findByEmail(normalizedEmail, transaction)) {
        throw new ConflictError("An administrator with this email already exists");
      }
      const admin = await authCrudService.createAdmin({
        name,
        email: normalizedEmail,
        passwordHash,
        isActive: false,
        invitationAcceptedAt: null,
      }, transaction);
      const { rawToken, tokenHash, expiresAt } = createOneTimeToken();
      await authCrudService.createResetToken({ adminUserId: admin.id, tokenHash, expiresAt }, transaction);
      return { admin, rawToken };
    });

    await sendInvitationEmail(invitation.admin, invitation.rawToken, inviter);
    return invitation.admin.toSafeJSON();
  },

  async resendAdminInvitation(adminUserId, inviter) {
    const invitation = await sequelize.transaction(async (transaction) => {
      const admin = await authCrudService.findById(adminUserId, transaction);
      if (!admin) throw new NotFoundError("Administrator not found");
      if (admin.invitationAcceptedAt) throw new ConflictError("This invitation has already been accepted");

      const { rawToken, tokenHash, expiresAt } = createOneTimeToken();
      await authCrudService.invalidateResetTokens(admin.id, transaction);
      await authCrudService.createResetToken({ adminUserId: admin.id, tokenHash, expiresAt }, transaction);
      return { admin, rawToken };
    });

    await sendInvitationEmail(invitation.admin, invitation.rawToken, inviter);
    return invitation.admin.toSafeJSON();
  },

  async setAdminActive(adminUserId, isActive, currentAdmin) {
    return sequelize.transaction(async (transaction) => {
      const admins = await authCrudService.listAdmins(transaction, true);
      const admin = admins.find((item) => item.id === adminUserId);
      if (!admin) throw new NotFoundError("Administrator not found");
      if (!admin.invitationAcceptedAt) throw new ConflictError("Pending invitations cannot be activated manually");
      if (admin.id === currentAdmin.id && !isActive) {
        throw new ForbiddenError("You cannot disable your own account");
      }
      if (!isActive && admin.isActive && admins.filter(
        (item) => item.isActive && item.invitationAcceptedAt,
      ).length === 1) {
        throw new ConflictError("The last active administrator cannot be disabled");
      }
      if (admin.isActive === isActive) return admin.toSafeJSON();
      await authCrudService.update(admin, {
        isActive,
        tokenVersion: admin.tokenVersion + 1,
      }, transaction);
      if (!isActive) await authCrudService.invalidateResetTokens(admin.id, transaction);
      return admin.toSafeJSON();
    });
  },

  async cancelAdminInvitation(adminUserId) {
    return sequelize.transaction(async (transaction) => {
      const admin = await authCrudService.findById(adminUserId, transaction);
      if (!admin) throw new NotFoundError("Administrator not found");
      if (admin.invitationAcceptedAt) {
        throw new ConflictError("Accepted administrator accounts must be disabled instead");
      }
      await authCrudService.deleteAdmin(admin, transaction);
      return { id: adminUserId };
    });
  },
};
