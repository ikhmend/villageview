import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/village_view_test";
process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
process.env.SMTP_HOST = "smtp.example.com";
process.env.SMTP_USER = "test-user";
process.env.SMTP_PASS = "test-password";
process.env.EMAIL_FROM = "Village View <test@example.com>";

const { sequelize } = await import("../src/config/database.js");
const { bookingCrudService } = await import("../src/modules/bookings/booking.crud.service.js");
const { bookingBusinessService } = await import("../src/modules/bookings/booking.business.service.js");

test("business service rejects bookings longer than seven nights", () => {
  assert.throws(
    () => bookingBusinessService.createPublic({
      guestName: "Test Guest",
      phone: "99112233",
      email: "guest@example.com",
      guests: 2,
      checkin: "2026-07-03",
      checkout: "2026-07-18",
    }),
    (error) => error.code === "CONFLICT" && error.message === "Захиалгын хугацаа 7 шөнөөс хэтрэхгүй байна.",
  );
});

test("public bookings receive a seven-day pending expiration", async (t) => {
  const transaction = { id: "booking-transaction" };
  let createdPayload;
  let expirationSweep;
  t.mock.method(sequelize, "transaction", async (callback) => callback(transaction));
  t.mock.method(bookingCrudService, "expirePending", async (expiresBefore, receivedTransaction) => {
    expirationSweep = expiresBefore;
    assert.equal(receivedTransaction, transaction);
  });
  t.mock.method(bookingCrudService, "findActiveOverlap", async () => null);
  t.mock.method(bookingCrudService, "create", async (payload, receivedTransaction) => {
    assert.equal(receivedTransaction, transaction);
    createdPayload = payload;
    return payload;
  });
  const payload = {
    guestName: "Test Guest",
    phone: "99112233",
    email: "guest@example.com",
    guests: 2,
    checkin: "2026-07-03",
    checkout: "2026-07-05",
  };
  const startedAt = Date.now();

  await bookingBusinessService.createPublic(payload);

  const finishedAt = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  assert.ok(expirationSweep instanceof Date);
  assert.equal(createdPayload.status, "pending");
  assert.ok(createdPayload.pendingExpiresAt instanceof Date);
  assert.ok(createdPayload.pendingExpiresAt.getTime() >= startedAt + sevenDays);
  assert.ok(createdPayload.pendingExpiresAt.getTime() <= finishedAt + sevenDays);
});

test("expired pending bookings are swept before availability is calculated", async (t) => {
  const calls = [];
  t.mock.method(bookingCrudService, "expirePending", async () => calls.push("expire"));
  t.mock.method(bookingCrudService, "findActiveRanges", async () => {
    calls.push("ranges");
    return [];
  });

  await bookingBusinessService.getAvailability({ start: "2026-07-03", end: "2026-07-10" });

  assert.deepEqual(calls, ["expire", "ranges"]);
});
