import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../lib/api";
import "../styles/admin.css";
export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleSubmit(event) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") || "").trim();
    setLoading(true);
    setError("");
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.status === 429
        ? "Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу."
        : "Хүсэлтийг илгээж чадсангүй. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="adminPage adminLoginPage">
      <AuthHeader />
      <main className="loginMain">
        <section className="loginCard">
          <p className="adminEyebrow">Нууц үг сэргээх</p>
          <h1>И-мэйлээ<br />шалгана уу.</h1>
          {submitted ? (
            <div className="authSuccess">
              <p>Хэрэв энэ и-мэйлээр бүртгэл байгаа бол нууц үг шинэчлэх холбоос илгээгдэнэ.</p>
              <Link to="/admin/login">Нэвтрэх хуудас руу буцах →</Link>
            </div>
          ) : (
            <>
              <p>Админ бүртгэлтэй и-мэйлээ оруулна уу. Нэг удаагийн холбоос илгээнэ.</p>
              <form onSubmit={handleSubmit}>
                <label className="loginField"><span>И-мэйл</span><input name="email" type="email" autoComplete="email" maxLength="254" aria-invalid={Boolean(error)} required autoFocus /></label>
                <p className="loginError" role="alert" aria-live="polite">{error}</p>
                <button className="loginButton" type="submit" disabled={loading}>{loading ? "Илгээж байна..." : "Холбоос илгээх"}<span>→</span></button>
                <div className="loginMeta"><Link to="/admin/login">Нэвтрэх хуудас руу буцах</Link></div>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function AuthHeader() {
  return <header className="adminHeader"><Link className="adminBrand" to="/"><span className="adminBrandMark">V</span><span>Village View</span><small>Admin</small></Link><Link className="siteLink" to="/">Сайт руу очих ↗</Link></header>;
}
