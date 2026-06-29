import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/admin.css";

export default function AdminLoginPage() {
  const { admin, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="routeLoading">Уншиж байна...</div>;
  if (!loading && admin) return <Navigate to="/admin" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError("");
    try {
      await login({ email: form.get("email"), password: form.get("password") });
      navigate(location.state?.from || "/admin", { replace: true });
    } catch (requestError) {
      setError(requestError.status === 429
        ? "Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу."
        : "И-мэйл эсвэл нууц үг буруу байна.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="adminPage adminLoginPage">
      <header className="adminHeader">
        <Link className="adminBrand" to="/"><span className="adminBrandMark">V</span><span>Village View</span><small>Admin</small></Link>
        <Link className="siteLink" to="/">Сайт руу очих <span aria-hidden="true">↗</span></Link>
      </header>
      <main className="loginMain">
        <section className="loginCard">
          <p className="adminEyebrow">Админ нэвтрэх</p>
          <h1>Тавтай<br />морилно уу.</h1>
          <p>Захиалгын удирдлагад нэвтрэхийн тулд админ мэдээллээ оруулна уу.</p>
          <form onSubmit={handleSubmit}>
            <label className="loginField"><span>И-мэйл</span><input name="email" type="email" autoComplete="username" required autoFocus /></label>
            <label className="loginField"><span>Нууц үг</span><input name="password" type="password" autoComplete="current-password" minLength="8" required /></label>
            <p className="loginError" role="alert">{error}</p>
            <button className="loginButton" type="submit" disabled={submitting}>{submitting ? "Нэвтэрч байна..." : "Нэвтрэх"}<span>→</span></button>
          </form>
        </section>
      </main>
    </div>
  );
}
