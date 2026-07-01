import { sendSuccess } from "../../common/helpers/send-success.js";
import { bookingBusinessService } from "./booking.business.service.js";
export const bookingController = {
  async availability(req, res) {
    const data = await bookingBusinessService.getAvailability(req.validated.query);
    return sendSuccess(res, data, "Availability retrieved");
  },
  async createPublic(req, res) {
    const booking = await bookingBusinessService.createPublic(req.validated.body);
    const io = req.app.get("io");
    if (io) io.to("admins").emit("booking:created", booking);
    return sendSuccess(res, booking, "Booking request received");
  },
  async confirmation(req, res) {
    const booking = await bookingBusinessService.getConfirmation(req.validated.params.id);
    return sendSuccess(res, booking, "Booking retrieved");
  },
  async list(req, res) {
    const { rows, meta } = await bookingBusinessService.list(req.validated.query);
    return sendSuccess(res, rows, "Bookings retrieved", meta);
  },
  async createAdmin(req, res) {
    const booking = await bookingBusinessService.createAdmin(req.validated.body);
    return sendSuccess(res, booking, "Booking created");
  },
  async update(req, res) {
    const booking = await bookingBusinessService.update(
      req.validated.params.id,
      req.validated.body,
    );
    return sendSuccess(res, booking, "Booking updated");
  },
  async remove(req, res) {
    const data = await bookingBusinessService.remove(req.validated.params.id);
    return sendSuccess(res, data, "Booking deleted");
  },
};
