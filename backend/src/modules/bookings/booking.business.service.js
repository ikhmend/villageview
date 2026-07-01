import { sequelize } from "../../config/database.js";
import { ConflictError, NotFoundError } from "../../common/errors/app-error.js";
import { bookingCrudService } from "./booking.crud.service.js";
function addDays(isoDate, days) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}
async function assertDatesAvailable({ checkin, checkout, excludeId }, transaction) {
  const conflict = await bookingCrudService.findActiveOverlap({ checkin, checkout, excludeId },transaction,);
  if (conflict) {
    throw new ConflictError("The selected dates are already booked", {checkin, checkout,});
  }
}
export const bookingBusinessService = {
async list({ page = 1, limit = 50, ...filters }) {
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
  async getConfirmation(id) {
    const booking = await bookingCrudService.getById(id);
    if (!booking) throw new NotFoundError("Booking not found");
    return booking;
  },
  async getAvailability({ start, end }) {
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
    return sequelize.transaction(async (transaction) => {
      await assertDatesAvailable(payload, transaction);
      return bookingCrudService.create({ ...payload, status: "pending", notes: "" }, transaction);
    });
  },
  createAdmin(payload) {
    return sequelize.transaction(async (transaction) => {
      if (payload.status !== "cancelled") await assertDatesAvailable(payload, transaction);
      return bookingCrudService.create(payload, transaction);
    });
  },
  update(id, payload) {
    return sequelize.transaction(async (transaction) => {
      const booking = await bookingCrudService.getById(id, transaction);
      if (!booking) 
        throw new NotFoundError("Booking not found");
      const candidate = { ...booking.toJSON(), ...payload };
      if (candidate.checkout <= candidate.checkin) {
        throw new ConflictError("Checkout must be after checkin");
      }
      if (candidate.status !== "cancelled") {
        await assertDatesAvailable({checkin: candidate.checkin, checkout: candidate.checkout, excludeId: booking.id,}, transaction);
      }
      return bookingCrudService.update(booking, payload, transaction);
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
