const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.error?.message || "Сервертэй холбогдож чадсангүй.");
    error.code = payload?.error?.code;
    error.details = payload?.error?.details;
    throw error;
  }
  return payload;
}

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
