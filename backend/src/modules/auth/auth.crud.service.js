import { authRepository } from "./auth.repository.js";

export const authCrudService = {
  findByEmailWithPassword(email, transaction) {
    return authRepository.findByEmailWithPassword(email, transaction);
  },
  findById(id, transaction) {
    return authRepository.findById(id, transaction);
  },
  update(instance, payload, transaction) {
    return authRepository.update(instance, payload, transaction);
  },
};
