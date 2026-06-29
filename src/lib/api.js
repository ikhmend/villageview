const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
const TOKEN_KEY = "villageViewAdminToken";

export const authToken = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken.get() ? { Authorization: `Bearer ${authToken.get()}` } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.error?.message || "Сервертэй холбогдож чадсангүй.");
    error.code = payload?.error?.code;
    error.status = response.status;
    error.details = payload?.error?.details;
    if (response.status === 401) {
      authToken.clear();
      window.dispatchEvent(new Event("admin-auth-expired"));
    }
    throw error;
  }
  return payload;
}

export const authApi = {
  async login(credentials) {
    return (await request("/auth/login", { method: "POST", body: JSON.stringify(credentials) })).data;
  },
  async me() {
    return (await request("/auth/me")).data;
  },
  async forgotPassword(email) {
    return request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  async resetPassword(token, password) {
    const response = await request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
    authToken.clear();
    window.dispatchEvent(new Event("admin-auth-expired"));
    return response.data;
  },
};

export const bookingApi = {
  async availability(start, end) {
    const query = new URLSearchParams({ start, end });
    return (await request(`/bookings/availability?${query}`)).data;
  },
  async create(payload) {
    return (await request("/bookings", { method: "POST", body: JSON.stringify(payload) })).data;
  },
  async confirmation(id) {
    return (await request(`/bookings/${id}/confirmation`)).data;
  },
  async list(filters = {}) {
    const query = new URLSearchParams(filters);
    return request(`/admin/bookings?${query}`);
  },
  async createAdmin(payload) {
    return (await request("/admin/bookings", { method: "POST", body: JSON.stringify(payload) })).data;
  },
  async update(id, payload) {
    return (await request(`/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify(payload) })).data;
  },
  async remove(id) {
    return (await request(`/admin/bookings/${id}`, { method: "DELETE" })).data;
  },
};
