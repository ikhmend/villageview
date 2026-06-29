import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../lib/api";
import "../styles/admin.css";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmation = String(form.get("confirmation"));
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
      setError(requestError.code === "INVALID_RESET_TOKEN"
        ? "Холбоос хүчингүй эсвэл хугацаа нь дууссан байна."
        : requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adminPage adminLoginPage">
      <header className="adminHeader"><Link className="adminBrand" to="/"><span className="adminBrandMark">V</span><span>Village View</span><small>Admin</small></Link><Link className="siteLink" to="/">Сайт руу очих ↗</Link></header>
      <main className="loginMain">
        <section className="loginCard">
          <p className="adminEyebrow">Шинэ нууц үг</p>
          <h1>Нууц үгээ<br />шинэчилнэ үү.</h1>
          {complete ? (
            <div className="authSuccess"><p>Нууц үг амжилттай шинэчлэгдлээ. Өмнөх админ session-ууд хүчингүй болсон.</p><Link to="/admin/login">Одоо нэвтрэх →</Link></div>
          ) : !token ? (
            <div className="authSuccess isError"><p>Нууц үг шинэчлэх token олдсонгүй.</p><Link to="/admin/forgot-password">Шинэ холбоос авах →</Link></div>
          ) : (
            <>
              <p>12-оос доошгүй тэмдэгт, том/жижиг үсэг, тоо болон тусгай тэмдэгт ашиглана уу.</p>
              <form onSubmit={handleSubmit}>
                <label className="loginField"><span>Шинэ нууц үг</span><input name="password" type="password" autoComplete="new-password" minLength="12" required autoFocus /></label>
                <label className="loginField"><span>Нууц үг давтах</span><input name="confirmation" type="password" autoComplete="new-password" minLength="12" required /></label>
                <p className="loginError" role="alert">{error}</p>
                <button className="loginButton" type="submit" disabled={loading}>{loading ? "Хадгалж байна..." : "Нууц үг шинэчлэх"}<span>→</span></button>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
