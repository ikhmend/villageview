import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);
}
export const emailService = {
  sendPasswordReset({ email, name, resetUrl, expiresInMinutes }) {
    const safeName = escapeHtml(name || "Admin");
    const safeUrl = escapeHtml(resetUrl);
    return transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: "Village View админ нууц үг сэргээх",
      text: `Сайн байна уу, ${name || "Admin"}. Нууц үгээ шинэчлэх холбоос: ${resetUrl}. Холбоос ${expiresInMinutes} минутын дараа хүчингүй болно.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1c211b">
          <h2>Сайн байна уу, ${safeName}.</h2>
          <p>Доорх холбоосоор админ нууц үгээ шинэчилнэ үү.</p>
          <p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#26382d;color:#fff;text-decoration:none">Нууц үг шинэчлэх</a></p>
          <p>Энэ холбоос ${expiresInMinutes} минутын дараа хүчингүй болно.</p>
          <p>Хэрэв та хүсэлт гаргаагүй бол энэ имэйлийг үл тоомсорлоно уу.</p>
        </div>
      `,
    });
  },
};
