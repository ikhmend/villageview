import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AdminPage from "./pages/AdminPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<ProtectedAdminRoute><AdminPage /></ProtectedAdminRoute>} />
      <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ProtectedAdminRoute({ children }) {
  const { admin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="routeLoading">Уншиж байна...</div>;
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}
