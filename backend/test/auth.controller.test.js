import assert from "node:assert/strict";
import { once } from "node:events";
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
const { default: express } = await import("express");
const { errorHandler, notFoundHandler } = await import("../src/common/middleware/error-handler.js");
const { authenticateAdmin } = await import("../src/common/middleware/authenticate-admin.js");
const { adminUserRouter } = await import("../src/modules/auth/admin-user.routes.js");
const { authBusinessService } = await import("../src/modules/auth/auth.business.service.js");
const {authRouter}= await import("../src/modules/auth/auth.routes.js")
test("POST /api/v1/admin/users/invitations authenticates and invites an admin", async (t) => {
  const currentAdmin = {
    id: "c9dfbf6b-6663-4cf4-a83a-c85b69799668",
    name: "Existing Admin",
    email: "existing.admin@example.com",
  };
  const invitedAdmin = {
    id: "12f96a45-f3e8-4a67-90b8-f45450a844da",
    name: "New Admin",
    email: "new.admin@example.com",
    isActive: false,
    invitationAcceptedAt: null,
  };
  const captured = {};
  t.mock.method(authBusinessService, "authenticateToken", async (token) => {
    captured.token = token;
    return currentAdmin;
  });
  t.mock.method(authBusinessService, "inviteAdmin", async (payload, inviter) => {
    captured.payload = payload;
    captured.inviter = inviter;
    return invitedAdmin;
  });
  const app = express();
  app.use(express.json());
  app.use("/api/v1/admin/users", authenticateAdmin, adminUserRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/v1/admin/users/invitations`, {
    method: "POST",
    headers: {
      Authorization: "Bearer valid-admin-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "  New Admin  ",
      email: "  New.Admin@Example.com  ",
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.deepEqual(body, {
    success: true,
    message: "Administrator invitation sent",
    data: invitedAdmin,
  });
  assert.equal(captured.token, "valid-admin-token");
  assert.deepEqual(captured.payload, {
    name: "New Admin",
    email: "new.admin@example.com",
  });
  assert.equal(captured.inviter, currentAdmin);
  assert.equal(authBusinessService.authenticateToken.mock.callCount(), 1);
  assert.equal(authBusinessService.inviteAdmin.mock.callCount(), 1);
});
test("POST /api/v1/auth/login returns an authenticated admin", async (t) => {
  const loginResult = {
    token: "signed-admin-jwt",
    expiresIn: "8h",
    admin: {
      id: "c9dfbf6b-6663-4cf4-a83a-c85b69799668",
      name: "Existing Admin",
      email: "admin@example.com",
      isActive: true,
    },
  };
  let capturedCredentials;
  t.mock.method(authBusinessService, "login", async (credentials) => {
    capturedCredentials = credentials;
    return loginResult;
  });
  const app = express();
  app.use(express.json());
  app.use("/api/v1/auth", authRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "  Admin@Example.com  ",
      password: "StrongPass1!",
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.deepEqual(capturedCredentials, {
    email: "Admin@Example.com",
    password: "StrongPass1!",
  });
  assert.deepEqual(body, {
    success: true,
    message: "Амжилттай нэвтэрлээ.",
    data: loginResult,
  });
  assert.equal(authBusinessService.login.mock.callCount(), 1);
});
test("GET	/api/v1/auth/me")