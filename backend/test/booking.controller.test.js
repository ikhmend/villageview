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
const { publicBookingRouter } = await import("../src/modules/bookings/booking.routes.js");
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
