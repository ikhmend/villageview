import { sendSuccess } from "../../common/helpers/send-success.js";
import { authBusinessService } from "./auth.business.service.js";

export const authController = {
  async login(req, res) {
    const data = await authBusinessService.login(req.validated.body);
    return sendSuccess(res, data, "Амжилттай нэвтэрлээ.");
  },
  async me(req, res) {
    return sendSuccess(res, req.admin.toSafeJSON(), "Admin retrieved");
  },
  async forgotPassword(req, res) {
    await authBusinessService.requestPasswordReset(req.validated.body);
    return sendSuccess(res, null, "If the account exists, a password reset link has been sent");
  },
  async resetPassword(req, res) {
    const data = await authBusinessService.resetPassword(req.validated.body);
    return sendSuccess(res, data, "Password reset successful");
  },
};
