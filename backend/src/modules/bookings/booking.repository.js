import { Op } from "sequelize";
import { Booking } from "./booking.model.js";

export const bookingRepository = {
  findAll({ status, search, from, to, limit, offset }, transaction) {
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = ["guestName", "phone", "email"].map((field) => ({
        [field]: { [Op.iLike]: `%${search}%` },
      }));
    }
    if (from || to) {
      where[Op.and] = [];
      if (from) where[Op.and].push({ checkout: { [Op.gt]: from } });
      if (to) where[Op.and].push({ checkin: { [Op.lt]: to } });
    }
    return Booking.findAndCountAll({
      where,
      limit,
      offset,
      order: [["checkin", "ASC"], ["createdAt", "ASC"], ["id", "ASC"]],
      transaction,
    });
  },

  findById(id, transaction) {
    return Booking.findByPk(id, { transaction });
  },

  count({ status, checkoutFrom }, transaction) {
    const where = {};
    if (status) where.status = status;
    if (checkoutFrom) where.checkout = { [Op.gte]: checkoutFrom };
    return Booking.count({ where, transaction });
  },

  expirePending(expiresBefore, transaction) {
    return Booking.update(
      { status: "cancelled", pendingExpiresAt: null },
      {
        where: {
          status: "pending",
          pendingExpiresAt: { [Op.lte]: expiresBefore },
        },
        transaction,
      },
    );
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

  findActiveOverlap({ checkin, checkout, excludeId }, transaction) {
    const where = {
      status: { [Op.in]: ["pending", "confirmed"] },
      checkin: { [Op.lt]: checkout },
      checkout: { [Op.gt]: checkin },
    };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return Booking.findOne({ where, transaction, lock: transaction?.LOCK?.UPDATE });
  },

  findActiveRanges({ start, end }, transaction) {
    return Booking.findAll({
      attributes: ["id", "checkin", "checkout"],
      where: {
        status: { [Op.in]: ["pending", "confirmed"] },
        checkin: { [Op.lt]: end },
        checkout: { [Op.gt]: start },
      },
      order: [["checkin", "ASC"]],
      transaction,
    });
  },

  findConfirmedRanges({ start, end }, transaction) {
    return Booking.findAll({
      attributes: ["checkin", "checkout"],
      where: {
        status: "confirmed",
        checkin: { [Op.lt]: end },
        checkout: { [Op.gt]: start },
      },
      transaction,
    });
  },
};
