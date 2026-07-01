import { z } from "zod";

const isoDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Date is invalid");
const status = z.enum(["pending", "confirmed", "cancelled"]);
const MAX_PUBLIC_BOOKING_NIGHTS = 30;
const MAX_PUBLIC_BOOKING_DAYS_AHEAD = 730;

function daysBetween(start, end) {
  return Math.round((Date.parse(`${end}T00:00:00.000Z`) - Date.parse(`${start}T00:00:00.000Z`)) / 86400000);
}

const bookingFields = {
  guestName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  email: z.string().email().max(254),
  guests: z.coerce.number().int().min(1).max(2),
  checkin: isoDate,
  checkout: isoDate,
};

const datesInOrder = (data) => data.checkout > data.checkin;

export const createPublicBookingSchema = z.object(bookingFields).refine(datesInOrder, {
  message: "checkout must be after checkin",
  path: ["checkout"],
}).refine((data) => data.checkin >= new Date().toISOString().slice(0, 10), {
  message: "checkin cannot be in the past",
  path: ["checkin"],
}).refine((data) => daysBetween(data.checkin, data.checkout) <= MAX_PUBLIC_BOOKING_NIGHTS, {
  message: `a public booking cannot exceed ${MAX_PUBLIC_BOOKING_NIGHTS} nights`,
  path: ["checkout"],
}).refine((data) => {
  const today = new Date().toISOString().slice(0, 10);
  return daysBetween(today, data.checkin) <= MAX_PUBLIC_BOOKING_DAYS_AHEAD;
}, {
  message: `checkin cannot be more than ${MAX_PUBLIC_BOOKING_DAYS_AHEAD} days in the future`,
  path: ["checkin"],
});

export const createAdminBookingSchema = z.object({
  ...bookingFields,
  status: status.default("confirmed"),
  notes: z.string().trim().max(2000).default(""),
}).refine(datesInOrder, {
  message: "checkout must be after checkin",
  path: ["checkout"],
});

export const updateBookingSchema = z.object({
  guestName: bookingFields.guestName.optional(),
  phone: bookingFields.phone.optional(),
  email: bookingFields.email.optional(),
  guests: bookingFields.guests.optional(),
  checkin: isoDate.optional(),
  checkout: isoDate.optional(),
  status: status.optional(),
  notes: z.string().trim().max(2000).optional(),
}).refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const bookingIdSchema = z.object({ id: z.string().uuid() });

export const listBookingsQuerySchema = z.object({
  status: status.optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const availabilityQuerySchema = z.object({
  start: isoDate,
  end: isoDate,
}).refine((data) => data.end > data.start, {
  message: "end must be after start",
  path: ["end"],
});
