import assert from "node:assert/strict";
import test from "node:test";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/village_view_test";
process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
process.env.SMTP_HOST = "smtp.example.com";
process.env.SMTP_PORT = "587";
process.env.SMTP_SECURE = "false";
process.env.SMTP_USER = "test-user";
process.env.SMTP_PASS = "test-password";
process.env.EMAIL_FROM = "Village View <test@example.com>";
const { createEmailService } = await import("../src/common/services/email.service.js");

test("sendAdminInvitation includes the invitation token and escapes HTML", async () => {
  const token = "a".repeat(64);
  const invitationUrl = `http://localhost:5173/admin/reset-password?token=${token}&invite=1`;
  let message;
  const transportResult = { messageId: "invitation-message-id" };
  const emailService = createEmailService({
    async sendMail(payload) {
      message = payload;
      return transportResult;
    },
  });
  const result = await emailService.sendAdminInvitation({
    email: "new.admin@example.com",
    name: "<New Admin>",
    invitationUrl,
    expiresInMinutes: 30,
    inviterName: "Admin & Owner",
  });
  assert.equal(result, transportResult);
  assert.equal(message.from, "Village View <test@example.com>");
  assert.equal(message.to, "new.admin@example.com");
  assert.equal(message.subject, "Village View админ урилга");
  assert.match(message.text, new RegExp(`token=${token}&invite=1`));
  assert.match(message.text, /30 минутын дараа/);
  assert.match(message.html, new RegExp(`token=${token}&amp;invite=1`));
  assert.match(message.html, /&lt;New Admin&gt;/);
  assert.match(message.html, /Admin &amp; Owner/);
  assert.doesNotMatch(message.html, /<New Admin>/);
});
