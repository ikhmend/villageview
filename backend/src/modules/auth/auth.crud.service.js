import { authRepository } from "./auth.repository.js";

export const authCrudService = {
  findByEmailWithPassword(email, transaction) {
    return authRepository.findByEmailWithPassword(email, transaction);
  },
  findByEmail(email, transaction) {
    return authRepository.findByEmail(email, transaction);
  },
  findById(id, transaction) {
    return authRepository.findById(id, transaction);
  },
  update(instance, payload, transaction) {
    return authRepository.update(instance, payload, transaction);
  },
  createResetToken(payload, transaction) {
    return authRepository.createResetToken(payload, transaction);
  },
  findValidResetToken(tokenHash, transaction) {
    return authRepository.findValidResetToken(tokenHash, transaction);
  },
  invalidateResetTokens(adminUserId, transaction) {
    return authRepository.invalidateResetTokens(adminUserId, transaction);
  },
};
