import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/village_view_test";
process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
process.env.CLIENT_ORIGIN = "http://localhost:5173";
process.env.PASSWORD_RESET_TTL_MINUTES = "30";
process.env.SMTP_HOST = "smtp.example.com";
process.env.SMTP_PORT = "587";
process.env.SMTP_SECURE = "false";
process.env.SMTP_USER = "test-user";
process.env.SMTP_PASS = "test-password";
process.env.EMAIL_FROM = "Village View <test@example.com>";
const { sequelize } = await import("../src/config/database.js");
const { emailService } = await import("../src/common/services/email.service.js");
const { authCrudService } = await import("../src/modules/auth/auth.crud.service.js");
const { authBusinessService } = await import("../src/modules/auth/auth.business.service.js");
test("inviteAdmin creates a pending admin and emails a matching one-time token", async () => {
  const transaction = { id: "test-transaction" };
  const safeAdmin = {
    id: "12f96a45-f3e8-4a67-90b8-f45450a844da",
    name: "New Admin",
    email: "new.admin@example.com",
    isActive: false,
    invitationAcceptedAt: null,
  };
  const admin = {
    ...safeAdmin,
    toSafeJSON: () => safeAdmin,
  };
  const captured = {};
  const originals = {
    transaction: sequelize.transaction,
    findByEmail: authCrudService.findByEmail,
    createAdmin: authCrudService.createAdmin,
    createResetToken: authCrudService.createResetToken,
    sendAdminInvitation: emailService.sendAdminInvitation,
  };
  sequelize.transaction = async (callback) => callback(transaction);
  authCrudService.findByEmail = async (email, receivedTransaction) => {
    assert.equal(email, "new.admin@example.com");
    assert.equal(receivedTransaction, transaction);
    return null;
  };
  authCrudService.createAdmin = async (payload, receivedTransaction) => {
    captured.adminPayload = payload;
    assert.equal(receivedTransaction, transaction);
    return admin;
  };
  authCrudService.createResetToken = async (payload, receivedTransaction) => {
    captured.tokenPayload = payload;
    assert.equal(receivedTransaction, transaction);
  };
  emailService.sendAdminInvitation = async (payload) => {
    captured.emailPayload = payload;
  };
  const startedAt = Date.now();
  try {
    const result = await authBusinessService.inviteAdmin({
      name: "New Admin",
      email: "NEW.ADMIN@EXAMPLE.COM",
    }, { name: "Existing Admin" });
    const finishedAt = Date.now();
    assert.deepEqual(result, safeAdmin);
    assert.equal(captured.adminPayload.name, "New Admin");
    assert.equal(captured.adminPayload.email, "new.admin@example.com");
    assert.equal(captured.adminPayload.isActive, false);
    assert.equal(captured.adminPayload.invitationAcceptedAt, null);
    assert.match(captured.adminPayload.passwordHash, /^\$2[aby]\$12\$/);
    assert.equal(captured.tokenPayload.adminUserId, safeAdmin.id);
    assert.match(captured.tokenPayload.tokenHash, /^[a-f0-9]{64}$/);
    assert.ok(captured.tokenPayload.expiresAt instanceof Date);
    assert.ok(captured.tokenPayload.expiresAt.getTime() >= startedAt + 30 * 60 * 1000);
    assert.ok(captured.tokenPayload.expiresAt.getTime() <= finishedAt + 30 * 60 * 1000);
    assert.equal(captured.emailPayload.email, safeAdmin.email);
    assert.equal(captured.emailPayload.name, safeAdmin.name);
    assert.equal(captured.emailPayload.inviterName, "Existing Admin");
    assert.equal(captured.emailPayload.expiresInMinutes, 30);
    const invitationUrl = new URL(captured.emailPayload.invitationUrl);
    const rawToken = invitationUrl.searchParams.get("token");
    assert.equal(invitationUrl.pathname, "/admin/reset-password");
    assert.equal(invitationUrl.searchParams.get("invite"), "1");
    assert.match(rawToken, /^[a-f0-9]{64}$/);
    assert.equal(
      crypto.createHash("sha256").update(rawToken).digest("hex"),
      captured.tokenPayload.tokenHash,
    );
  } finally {
    sequelize.transaction = originals.transaction;
    authCrudService.findByEmail = originals.findByEmail;
    authCrudService.createAdmin = originals.createAdmin;
    authCrudService.createResetToken = originals.createResetToken;
    emailService.sendAdminInvitation = originals.sendAdminInvitation;
  }
});
