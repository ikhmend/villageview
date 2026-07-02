import { Op } from "sequelize";
import { AdminUser } from "./admin-user.model.js";
import { PasswordResetToken } from "./password-reset-token.model.js";

export const authRepository = {
  findByEmailWithPassword(email, transaction) {
    return AdminUser.scope("withPassword").findOne({ where: { email }, transaction });
  },
  findByEmail(email, transaction) {
    return AdminUser.findOne({ where: { email }, transaction });
  },
  findById(id, transaction) {
    return AdminUser.findByPk(id, { transaction });
  },
  listAdmins(transaction, lock = false) {
    return AdminUser.findAll({
      order: [["createdAt", "ASC"]],
      transaction,
      ...(lock ? { lock: transaction.LOCK.UPDATE } : {}),
    });
  },
  listAdminsPage({ limit, offset }, transaction) {
    return AdminUser.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "ASC"], ["id", "ASC"]],
      transaction,
    });
  },
  createAdmin(payload, transaction) {
    return AdminUser.create(payload, { transaction });
  },
  deleteAdmin(instance, transaction) {
    return instance.destroy({ transaction });
  },
  update(instance, payload, transaction) {
    return instance.update(payload, { transaction });
  },
  createResetToken(payload, transaction) {
    return PasswordResetToken.create(payload, { transaction });
  },
  findValidResetToken(tokenHash, transaction) {
    return PasswordResetToken.findOne({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() },
      },
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    });
  },
  invalidateResetTokens(adminUserId, transaction) {
    return PasswordResetToken.update(
      { usedAt: new Date() },
      { where: { adminUserId, usedAt: null }, transaction },
    );
  },
};
