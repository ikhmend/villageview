import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, authToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(Boolean(authToken.get()));

  function logout() {
    authToken.clear();
    setAdmin(null);
    setLoading(false);
  }

  useEffect(() => {
    window.addEventListener("admin-auth-expired", logout);
    const token = authToken.get();
    if (!token) {
      setLoading(false);
      return () => window.removeEventListener("admin-auth-expired", logout);
    }

    authApi.me()
      .then(setAdmin)
      .catch(logout)
      .finally(() => setLoading(false));

    return () => window.removeEventListener("admin-auth-expired", logout);
  }, []);

  async function login(credentials) {
    const data = await authApi.login(credentials);
    authToken.set(data.token);
    setAdmin(data.admin);
    return data.admin;
  }

  const value = useMemo(() => ({ admin, loading, login, logout }), [admin, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
