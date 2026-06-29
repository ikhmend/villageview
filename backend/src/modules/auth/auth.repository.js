import { AdminUser } from "./admin-user.model.js";

export const authRepository = {
  findByEmailWithPassword(email, transaction) {
    return AdminUser.scope("withPassword").findOne({ where: { email }, transaction });
  },
  findById(id, transaction) {
    return AdminUser.findByPk(id, { transaction });
  },
  update(instance, payload, transaction) {
    return instance.update(payload, { transaction });
  },
};
