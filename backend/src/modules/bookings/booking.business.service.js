import { sequelize } from "../../config/database.js";
import { ConflictError, NotFoundError } from "../../common/errors/app-error.js";
import { bookingCrudService } from "./booking.crud.service.js";
function addDays(isoDate, days) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}
function daysBetween(start, end) {
  return Math.round((Date.parse(`${end}T00:00:00.000Z`) - Date.parse(`${start}T00:00:00.000Z`)) / 86400000);
}
const PENDING_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

function pendingExpirationDate() {
  return new Date(Date.now() + PENDING_EXPIRATION_MS);
}

function expirePendingBookings(transaction) {
  return bookingCrudService.expirePending(new Date(), transaction);
}
function assertMaximumStay({ checkin, checkout }) {
  if (daysBetween(checkin, checkout) > 7) {
    throw new ConflictError("Захиалгын хугацаа 7 шөнөөс хэтрэхгүй байна.");
  }
}
async function assertDatesAvailable({ checkin, checkout, excludeId }, transaction) {
  const conflict = await bookingCrudService.findActiveOverlap({ checkin, checkout, excludeId },transaction,);
  if (conflict) {
    throw new ConflictError("The selected dates are already booked", {checkin, checkout,});
  }
}
export const bookingBusinessService = {
async list({ page = 1, limit = 50, ...filters }) {
    await expirePendingBookings();
    const result = await bookingCrudService.list({
      ...filters,
      limit,
      offset: (page - 1) * limit,
    });
    return {
      rows: result.rows,
      meta: {
        page,
        limit,
        total: result.count,
        pages: Math.ceil(result.count / limit),
      },
    };
},
  async getAdminSummary() {
    await expirePendingBookings();
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
    const [confirmed, pending, ranges] = await Promise.all([
      bookingCrudService.count({ status: "confirmed", checkoutFrom: today }),
      bookingCrudService.count({ status: "pending" }),
      bookingCrudService.findConfirmedRanges({ start: monthStart, end: monthEnd }),
    ]);
    const nights = new Set();
    for (const range of ranges) {
      let date = range.checkin < monthStart ? monthStart : range.checkin;
      const end = range.checkout > monthEnd ? monthEnd : range.checkout;
      while (date < end) {
        nights.add(date);
        date = addDays(date, 1);
      }
    }
    return { confirmed, pending, nights: nights.size };
  },
  async getConfirmation(id) {
    await expirePendingBookings();
    const booking = await bookingCrudService.getById(id);
    if (!booking) throw new NotFoundError("Booking not found");
    return booking;
  },
  async getAvailability({ start, end }) {
    await expirePendingBookings();
    const ranges = await bookingCrudService.findActiveRanges({ start, end });
    const bookedDates = new Set();
    ranges.forEach((range) => {
      let date = range.checkin < start ? start : range.checkin;
      const rangeEnd = range.checkout > end ? end : range.checkout;
      while (date < rangeEnd) {
        bookedDates.add(date);
        date = addDays(date, 1);
      }
    });
    return {start, end, bookedDates: [...bookedDates].sort(), ranges: ranges.map(({ id, checkin, checkout }) => ({ id, checkin, checkout })),};
  },
  createPublic(payload) {
    assertMaximumStay(payload);
    return sequelize.transaction(async (transaction) => {
      await expirePendingBookings(transaction);
      await assertDatesAvailable(payload, transaction);
      return bookingCrudService.create({
        ...payload,
        status: "pending",
        notes: "",
        pendingExpiresAt: pendingExpirationDate(),
      }, transaction);
    });
  },
  createAdmin(payload) {
    assertMaximumStay(payload);
    return sequelize.transaction(async (transaction) => {
      await expirePendingBookings(transaction);
      if (payload.status !== "cancelled") await assertDatesAvailable(payload, transaction);
      return bookingCrudService.create({
        ...payload,
        pendingExpiresAt: payload.status === "pending" ? pendingExpirationDate() : null,
      }, transaction);
    });
  },
  update(id, payload) {
    return sequelize.transaction(async (transaction) => {
      await expirePendingBookings(transaction);
      const booking = await bookingCrudService.getById(id, transaction);
      if (!booking) 
        throw new NotFoundError("Booking not found");
      const candidate = { ...booking.toJSON(), ...payload };
      if (candidate.checkout <= candidate.checkin) {
        throw new ConflictError("Checkout must be after checkin");
      }
      assertMaximumStay(candidate);
      if (candidate.status !== "cancelled") {
        await assertDatesAvailable({checkin: candidate.checkin, checkout: candidate.checkout, excludeId: booking.id,}, transaction);
      }
      const expirationUpdate = payload.status === "pending"
        ? { pendingExpiresAt: booking.status === "pending" && booking.pendingExpiresAt
          ? booking.pendingExpiresAt
          : pendingExpirationDate() }
        : payload.status
          ? { pendingExpiresAt: null }
          : {};
      return bookingCrudService.update(booking, { ...payload, ...expirationUpdate }, transaction);
    });
  },
  remove(id) {
    return sequelize.transaction(async (transaction) => {
      const booking = await bookingCrudService.getById(id, transaction);
      if (!booking) throw new NotFoundError("Booking not found");
      await bookingCrudService.remove(booking, transaction);
      return { id };
    });
  },
};
