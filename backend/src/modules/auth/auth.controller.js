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
};
