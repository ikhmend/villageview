import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { receiveMessageOnPort } from "node:worker_threads";
import { email } from "zod";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET ="test-secret-that-is-at-least-32-characters-long";
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
test("inviteAdmin creates a pending admin and sends an invitation", async (t) => {
  const transaction = { id: "test-transaction" };
  const safeAdmin = {
    id: "12f96a45-f3e8-4a67-90b8-f45450a844da",
    name: "New Admin",
    email: "new.admin@example.com",
    isActive: false,
    invitationAcceptedAt: null,
  };
  const captured = {};
  t.mock.method(sequelize, "transaction",
    async (callback) => callback(transaction),
  );
  t.mock.method(authCrudService, "findByEmail",
    async (email, receivedTransaction) => {
      assert.equal(email, "new.admin@example.com");
      assert.equal(receivedTransaction, transaction);
      return null;
    },
  );
  t.mock.method(authCrudService, "createAdmin", async (payload, receivedTransaction) => {
      assert.equal(receivedTransaction, transaction);
      captured.admin = payload;
      return {
        ...safeAdmin,
        toSafeJSON: () => safeAdmin,
      };
    },
  );
  t.mock.method(authCrudService, "createResetToken", async (payload, receivedTransaction) => {
      assert.equal(receivedTransaction, transaction);
      captured.token = payload;
    },
  );
  t.mock.method(emailService, "sendAdminInvitation", async (payload) => {captured.email = payload;},);
  const startedAt = Date.now();
  const result = await authBusinessService.inviteAdmin(
    {
      name: "New Admin",
      email: "NEW.ADMIN@EXAMPLE.COM",
    },
    {
      name: "Existing Admin",
    },
  );
  const finishedAt = Date.now();
  assert.deepEqual(result, safeAdmin);
  assert.deepEqual(
    {
      name: captured.admin.name,
      email: captured.admin.email,
      isActive: captured.admin.isActive,
      invitationAcceptedAt: captured.admin.invitationAcceptedAt,
    },
    {
      name: "New Admin",
      email: "new.admin@example.com",
      isActive: false,
      invitationAcceptedAt: null,
    },
  );
  assert.match(captured.admin.passwordHash, /^\$2[aby]\$12\$/);
  assert.equal(captured.token.adminUserId, safeAdmin.id);
  assert.match(captured.token.tokenHash, /^[a-f0-9]{64}$/);
  assert.ok(captured.token.expiresAt instanceof Date);
  const expiresAt = captured.token.expiresAt.getTime();
  const ttl = 30 * 60 * 1000;
  assert.ok(expiresAt >= startedAt + ttl);
  assert.ok(expiresAt <= finishedAt + ttl);
  assert.equal(captured.email.email, safeAdmin.email);
  assert.equal(captured.email.name, safeAdmin.name);
  assert.equal(captured.email.inviterName, "Existing Admin");
  assert.equal(captured.email.expiresInMinutes, 30);
  const invitationUrl = new URL(captured.email.invitationUrl);
  const rawToken = invitationUrl.searchParams.get("token");
  assert.equal(invitationUrl.pathname, "/admin/reset-password");
  assert.equal(invitationUrl.searchParams.get("invite"), "1");
  assert.match(rawToken, /^[a-f0-9]{64}$/);
  const expectedHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  assert.equal(expectedHash, captured.token.tokenHash);
});