import { Op } from "sequelize";
import { Booking } from "./booking.model.js";

export const bookingRepository = {
  findAll({ status, from, to, limit, offset }, transaction) {
    const where = {};
    if (status) where.status = status;
    if (from || to) {
      where[Op.and] = [];
      if (from) where[Op.and].push({ checkout: { [Op.gt]: from } });
      if (to) where[Op.and].push({ checkin: { [Op.lt]: to } });
    }
    return Booking.findAndCountAll({ where, limit, offset, transaction });
  },

  findById(id, transaction) {
    return Booking.findByPk(id, { transaction });
  },

  create(payload, transaction) {
    return Booking.create(payload, { transaction });
  },

  async update(instance, payload, transaction) {
    return instance.update(payload, { transaction });
  },

  async remove(instance, transaction) {
    await instance.destroy({ transaction });
  },

  findConfirmedOverlap({ checkin, checkout, excludeId }, transaction) {
    const where = {
      status: "confirmed",
      checkin: { [Op.lt]: checkout },
      checkout: { [Op.gt]: checkin },
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return Booking.findOne({ where, transaction, lock: transaction?.LOCK?.UPDATE });
  },

  findConfirmedRanges({ start, end }, transaction) {
    return Booking.findAll({
      attributes: ["id", "checkin", "checkout"],
      where: {
        status: "confirmed",
        checkin: { [Op.lt]: end },
        checkout: { [Op.gt]: start },
      },
      order: [["checkin", "ASC"]],
      transaction,
    });
  },
};
