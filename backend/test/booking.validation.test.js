import assert from "node:assert/strict";
import test from "node:test";
import { createAdminBookingSchema, createPublicBookingSchema, listBookingsQuerySchema } from "../src/modules/bookings/booking.validation.js";

test("booking list pagination accepts a bounded search", () => {
  assert.deepEqual(listBookingsQuerySchema.parse({ page: "2", limit: "25", search: "  guest  " }), {
    page: 2,
    limit: 25,
    search: "guest",
  });
  assert.equal(listBookingsQuerySchema.safeParse({ search: "x".repeat(121) }).success, false);
});

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

test("public bookings accept a seven-night stay within the one-year horizon", () => {
  const result = createPublicBookingSchema.safeParse(booking({
    checkin: isoDateFromToday(358),
    checkout: isoDateFromToday(365),
  }));
  assert.equal(result.success, true);
});

test("public bookings reject stays longer than seven nights", () => {
  const result = createPublicBookingSchema.safeParse(booking({
    checkin: isoDateFromToday(1),
    checkout: isoDateFromToday(9),
  }));
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path[0] === "checkout"));
});

test("admin bookings also reject stays longer than seven nights", () => {
  const result = createAdminBookingSchema.safeParse({
    ...booking({ checkin: isoDateFromToday(1), checkout: isoDateFromToday(9) }),
    status: "confirmed",
    notes: "",
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path[0] === "checkout"));
});

test("public bookings reject checkout beyond the one-year calendar", () => {
  const result = createPublicBookingSchema.safeParse(booking({
    checkin: isoDateFromToday(360),
    checkout: isoDateFromToday(366),
  }));
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.path[0] === "checkout"));
});
