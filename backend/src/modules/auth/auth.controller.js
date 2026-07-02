import { sendSuccess } from "../../common/helpers/send-success.js";
import { authBusinessService } from "./auth.business.service.js";
import { disconnectAdminSockets } from "../../common/services/socket.service.js";
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
    const io = req.app.get("io");
    disconnectAdminSockets(io, data.adminId);
    const responseData = {
      reset: data.reset,
      invitationAccepted: data.invitationAccepted,
    };
    return sendSuccess(res, responseData, "Password reset successful");
  },
  async listAdmins(req, res) {
    const { rows, meta } = await authBusinessService.listAdmins(req.validated.query);
    return sendSuccess(res, rows, "Administrators retrieved", meta);
  },
  async inviteAdmin(req, res) {
    const data = await authBusinessService.inviteAdmin(req.validated.body, req.admin);
    return sendSuccess(res, data, "Administrator invitation sent");
  },
  async resendAdminInvitation(req, res) {
    const data = await authBusinessService.resendAdminInvitation(req.validated.params.id, req.admin);
    return sendSuccess(res, data, "Administrator invitation resent");
  },
  async updateAdmin(req, res) {
    const adminId = req.validated.params.id;
    const isActive = req.validated.body.isActive;
    const data = await authBusinessService.setAdminActive(
      adminId,
      isActive,
      req.admin,
    );
    if (!isActive) {
      const io = req.app.get("io");
      disconnectAdminSockets(io, adminId);
    }
    return sendSuccess(res, data, "Administrator updated");
  },
  async cancelAdminInvitation(req, res) {
    const data = await authBusinessService.cancelAdminInvitation(req.validated.params.id);
    return sendSuccess(res, data, "Administrator invitation cancelled");
  },
};
