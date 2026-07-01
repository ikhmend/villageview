import assert from "node:assert/strict";
import test from "node:test";
import { createPublicBookingSchema } from "../src/modules/bookings/booking.validation.js";

function isoDateFromToday(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function booking(overrides = {}) {
  return {
    guestName: "Test Guest",
    phone: "99112233",
    email: "guest@example.com",
    guests: 2,
    checkin: isoDateFromToday(1),
    checkout: isoDateFromToday(2),
    ...overrides,
  };
}

test("public bookings accept stays within the supported window", () => {
  const result = createPublicBookingSchema.safeParse(booking({
    checkin: isoDateFromToday(700),
    checkout: isoDateFromToday(730),
  }));
  assert.equal(result.success, true);
});

test("public bookings reject stays longer than 30 nights", () => {
  const result = createPublicBookingSchema.safeParse(booking({
    checkin: isoDateFromToday(1),
    checkout: isoDateFromToday(32),
  }));
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path[0] === "checkout"));
});

test("public bookings reject checkins beyond the two-year calendar", () => {
  const result = createPublicBookingSchema.safeParse(booking({
    checkin: isoDateFromToday(731),
    checkout: isoDateFromToday(732),
  }));
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path[0] === "checkin"));
});
