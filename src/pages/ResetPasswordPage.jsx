import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../lib/api";
import "../styles/admin.css";

const RESET_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const isInvitation = searchParams.get("invite") === "1";
  const hasValidTokenFormat = RESET_TOKEN_PATTERN.test(token);
  const [complete, setComplete] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmation = String(form.get("confirmation"));
    if (password.length < 12 || password.length > 128) {
      setError("Нууц үг 12-оос 128 тэмдэгттэй байх ёстой.");
      return;
    }
    if (password !== confirmation) {
      setError("Нууц үгнүүд хоорондоо таарахгүй байна.");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(password)) {
      setError("Том/жижиг үсэг, тоо болон тусгай тэмдэгт оруулна уу.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authApi.resetPassword(token, password);
      setComplete(true);
    } catch (requestError) {
      if (requestError.code === "INVALID_RESET_TOKEN") {
        setInvalidToken(true);
      } else if (requestError.status === 429) {
        setError("Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу.");
      } else if (requestError.code === "VALIDATION_ERROR") {
        setError("Нууц үг шаардлага хангахгүй байна.");
      } else {
        setError("Нууц үгийг шинэчилж чадсангүй. Дахин оролдоно уу.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adminPage adminLoginPage">
      <header className="adminHeader"><Link className="adminBrand" to="/"><span className="adminBrandMark">V</span><span>Village View</span><small>Admin</small></Link><Link className="siteLink" to="/">Сайт руу очих ↗</Link></header>
      <main className="loginMain">
        <section className="loginCard">
          <p className="adminEyebrow">{isInvitation ? "Админ урилга" : "Шинэ нууц үг"}</p>
          <h1>{isInvitation ? <>Эрхээ<br />идэвхжүүлнэ үү.</> : <>Нууц үгээ<br />шинэчилнэ үү.</>}</h1>
          {complete ? (
            <div className="authSuccess"><p>{isInvitation ? "Админ эрх идэвхжиж, нууц үг амжилттай үүслээ." : "Нууц үг амжилттай шинэчлэгдлээ. Өмнөх админ session-ууд хүчингүй болсон."}</p><Link to="/admin/login">Одоо нэвтрэх →</Link></div>
          ) : !hasValidTokenFormat || invalidToken ? (
            <div className="authSuccess isError"><p>{isInvitation ? "Урилгын холбоос хүчингүй эсвэл хугацаа нь дууссан байна. Одоогийн админаас урилгыг дахин илгээхийг хүснэ үү." : "Нууц үг шинэчлэх холбоос хүчингүй эсвэл хугацаа нь дууссан байна."}</p><Link to={isInvitation ? "/admin/login" : "/admin/forgot-password"}>{isInvitation ? "Нэвтрэх хуудас руу буцах" : "Шинэ холбоос авах"} →</Link></div>
          ) : (
            <>
              <p>12-оос доошгүй тэмдэгт, том/жижиг үсэг, тоо болон тусгай тэмдэгт ашиглана уу.</p>
              <form onSubmit={handleSubmit}>
                <label className="loginField"><span>Шинэ нууц үг</span><input name="password" type="password" autoComplete="new-password" minLength="12" maxLength="128" aria-invalid={Boolean(error)} required autoFocus /></label>
                <label className="loginField"><span>Нууц үг давтах</span><input name="confirmation" type="password" autoComplete="new-password" minLength="12" maxLength="128" aria-invalid={Boolean(error)} required /></label>
                <p className="loginError" role="alert" aria-live="polite">{error}</p>
                <button className="loginButton" type="submit" disabled={loading}>{loading ? "Хадгалж байна..." : isInvitation ? "Эрх идэвхжүүлэх" : "Нууц үг шинэчлэх"}<span>→</span></button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
