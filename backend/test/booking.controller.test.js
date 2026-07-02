import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/village_view_test";
process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
process.env.SMTP_HOST = "smtp.example.com";
process.env.SMTP_USER = "test-user";
process.env.SMTP_PASS = "test-password";
process.env.EMAIL_FROM = "Village View <test@example.com>";

const { errorHandler, notFoundHandler } = await import("../src/common/middleware/error-handler.js");
const { adminBookingRouter, publicBookingRouter } = await import("../src/modules/bookings/booking.routes.js");
const { bookingBusinessService } = await import("../src/modules/bookings/booking.business.service.js");

test("public booking creation succeeds without Socket.IO attached", async (t) => {
  const checkin = new Date();
  checkin.setUTCDate(checkin.getUTCDate() + 1);
  const checkout = new Date(checkin);
  checkout.setUTCDate(checkout.getUTCDate() + 1);
  const checkinDate = checkin.toISOString().slice(0, 10);
  const checkoutDate = checkout.toISOString().slice(0, 10);
  const createdBooking = {
    id: "71227ed4-68dc-477e-a77f-a11553398564",
    guestName: "Test Guest",
    phone: "99112233",
    email: "guest@example.com",
    guests: 2,
    checkin: checkinDate,
    checkout: checkoutDate,
    status: "pending",
    notes: "",
  };
  t.mock.method(bookingBusinessService, "createPublic", async () => createdBooking);

  const app = express();
  app.use(express.json());
  app.use("/api/v1/bookings", publicBookingRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  const response = await request(app)
    .post("/api/v1/bookings")
    .send({
      guestName: "Test Guest",
      phone: "99112233",
      email: "guest@example.com",
      guests: 2,
      checkin: checkinDate,
      checkout: checkoutDate,
    });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data, createdBooking);
  assert.equal(bookingBusinessService.createPublic.mock.callCount(), 1);
});

test("public booking creation succeeds when Socket.IO emission throws", async (t) => {
  const createdBooking = { id: "71227ed4-68dc-477e-a77f-a11553398564", status: "pending" };
  t.mock.method(bookingBusinessService, "createPublic", async () => createdBooking);
  t.mock.method(console, "error", () => {});
  const app = express();
  app.set("io", {
    to() {
      return { emit() { throw new Error("socket unavailable"); } };
    },
  });
  app.use(express.json());
  app.use("/api/v1/bookings", publicBookingRouter);
  app.use(errorHandler);
  const checkin = new Date();
  checkin.setUTCDate(checkin.getUTCDate() + 1);
  const checkout = new Date(checkin);
  checkout.setUTCDate(checkout.getUTCDate() + 1);

  const response = await request(app).post("/api/v1/bookings").send({
    guestName: "Test Guest",
    phone: "99112233",
    email: "guest@example.com",
    guests: 2,
    checkin: checkin.toISOString().slice(0, 10),
    checkout: checkout.toISOString().slice(0, 10),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data, createdBooking);
});

test("public booking validation explains the seven-night limit", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/bookings", publicBookingRouter);
  app.use(errorHandler);
  const checkin = new Date();
  checkin.setUTCDate(checkin.getUTCDate() + 1);
  const checkout = new Date(checkin);
  checkout.setUTCDate(checkout.getUTCDate() + 8);

  const response = await request(app).post("/api/v1/bookings").send({
    guestName: "Test Guest",
    phone: "99112233",
    email: "guest@example.com",
    guests: 2,
    checkin: checkin.toISOString().slice(0, 10),
    checkout: checkout.toISOString().slice(0, 10),
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, "VALIDATION_ERROR");
  assert.equal(response.body.error.message, "Захиалгын хугацаа 7 шөнөөс хэтрэхгүй байна.");
});

test("public booking creation is rate limited", async (t) => {
  t.mock.method(bookingBusinessService, "createPublic", async () => ({ id: "rate-limited-booking" }));
  const app = express();
  app.use(express.json());
  app.use("/api/v1/bookings", publicBookingRouter);
  app.use(errorHandler);
  const checkin = new Date();
  checkin.setUTCDate(checkin.getUTCDate() + 1);
  const checkout = new Date(checkin);
  checkout.setUTCDate(checkout.getUTCDate() + 1);
  const payload = {
    guestName: "Test Guest",
    phone: "99112233",
    email: "guest@example.com",
    guests: 2,
    checkin: checkin.toISOString().slice(0, 10),
    checkout: checkout.toISOString().slice(0, 10),
  };
  let limitedResponse;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await request(app).post("/api/v1/bookings").send(payload);
    if (response.status === 429) {
      limitedResponse = response;
      break;
    }
  }

  assert.ok(limitedResponse, "expected the booking limiter to reject repeated requests");
  assert.equal(limitedResponse.body.error.code, "BOOKING_RATE_LIMITED");
});

test("admin booking list returns pagination metadata", async (t) => {
  const meta = { page: 2, limit: 10, total: 14, pages: 2 };
  const listMock = t.mock.method(bookingBusinessService, "list", async () => ({
    rows: [{ id: "71227ed4-68dc-477e-a77f-a11553398564" }],
    meta,
  }));
  const app = express();
  app.use("/api/v1/admin/bookings", adminBookingRouter);
  app.use(errorHandler);

  const response = await request(app).get("/api/v1/admin/bookings?page=2&limit=10&search=guest");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.meta, meta);
  assert.deepEqual(listMock.mock.calls[0].arguments[0], {
    page: 2,
    limit: 10,
    search: "guest",
  });
});

test("admin booking summary returns aggregate data", async (t) => {
  const summary = { confirmed: 4, pending: 2, nights: 11 };
  t.mock.method(bookingBusinessService, "getAdminSummary", async () => summary);
  const app = express();
  app.use("/api/v1/admin/bookings", adminBookingRouter);
  app.use(errorHandler);

  const response = await request(app).get("/api/v1/admin/bookings/summary");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data, summary);
});
