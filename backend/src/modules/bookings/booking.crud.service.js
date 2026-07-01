import { bookingRepository } from "./booking.repository.js";

export const bookingCrudService = {
  list(filters, transaction) {
    return bookingRepository.findAll(filters, transaction);
  },
  getById(id, transaction) {
    return bookingRepository.findById(id, transaction);
  },
  create(payload, transaction) {
    return bookingRepository.create(payload, transaction);
  },
  update(instance, payload, transaction) {
    return bookingRepository.update(instance, payload, transaction);
  },
  remove(instance, transaction) {
    return bookingRepository.remove(instance, transaction);
  },
  findActiveOverlap(dates, transaction) {
    return bookingRepository.findActiveOverlap(dates, transaction);
  },
  findActiveRanges(range, transaction) {
    return bookingRepository.findActiveRanges(range, transaction);
  },
};
