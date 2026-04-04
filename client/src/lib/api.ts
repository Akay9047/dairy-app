import axios from "axios";

// @ts-ignore
const VITE_API_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || "";
const BASE_URL = VITE_API_URL ? `${VITE_API_URL}/api` : "/api";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

function getToken(): string | null {
  const isSuperPage = window.location.pathname.startsWith("/super");
  if (isSuperPage) return localStorage.getItem("dairy_sa_token");
  return localStorage.getItem("dairy_admin_token");
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isSuperPage = window.location.pathname.startsWith("/super");
      if (isSuperPage) {
        localStorage.removeItem("dairy_sa_token");
        localStorage.removeItem("dairy_sa_data");
        window.location.href = "/super/login";
      } else {
        localStorage.removeItem("dairy_admin_token");
        localStorage.removeItem("dairy_admin_data");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (d: { username: string; password: string }) =>
    api.post("/auth/login", d).then(r => r.data),
  superLogin: (d: { username: string; password: string }) =>
    api.post("/auth/super/login", d).then(r => r.data),
  me: () => api.get("/auth/me").then(r => r.data),
  updateLanguage: (language: string) =>
    api.patch("/auth/language", { language }).then(r => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch("/auth/change-password", { currentPassword, newPassword }).then(r => r.data),
  superChangePassword: (currentPassword: string, newPassword: string) =>
    api.patch("/auth/super/change-password", { currentPassword, newPassword }).then(r => r.data),
};

export const farmersApi = {
  list: (p?: { search?: string }) => api.get("/farmers", { params: p }).then(r => r.data),
  get: (id: string) => api.get(`/farmers/${id}`).then(r => r.data),
  create: (d: unknown) => api.post("/farmers", d).then(r => r.data),
  update: (id: string, d: unknown) => api.put(`/farmers/${id}`, d).then(r => r.data),
  delete: (id: string) => api.delete(`/farmers/${id}`).then(r => r.data),
};

export const milkApi = {
  list: (p?: { farmerId?: string; from?: string; to?: string; shift?: string; page?: number; limit?: number }) =>
    api.get("/milk", { params: p }).then(r => r.data),
  get: (id: string) => api.get(`/milk/${id}`).then(r => r.data),
  create: (d: unknown) => api.post("/milk", d).then(r => r.data),
  update: (id: string, d: unknown) => api.put(`/milk/${id}`, d).then(r => r.data),
  delete: (id: string) => api.delete(`/milk/${id}`).then(r => r.data),
};

export const dashboardApi = {
  stats: () => api.get("/dashboard/stats").then(r => r.data),
  chart: () => api.get("/dashboard/chart").then(r => r.data),
};

export const reportsApi = {
  farmer: (farmerId: string, p?: { from?: string; to?: string }) =>
    api.get(`/reports/farmer/${farmerId}`, { params: p }).then(r => r.data),
  monthly: (p?: { month?: number; year?: number }) =>
    api.get("/reports/monthly", { params: p }).then(r => r.data),
  weekly: (p?: { from?: string; to?: string }) =>
    api.get("/reports/weekly", { params: p }).then(r => r.data),
  exportCsv: (p?: { from?: string; to?: string; farmerId?: string }) =>
    api.get("/reports/export/csv", { params: p, responseType: "blob" }).then(r => r.data),
};

export const paymentsApi = {
  list: (p?: { farmerId?: string }) => api.get("/payments", { params: p }).then(r => r.data),
  dues: () => api.get("/payments/dues").then(r => r.data),
  dailySummary: (date?: string) =>
    api.get("/payments/daily-summary", { params: { date } }).then(r => r.data),
  create: (d: unknown) => api.post("/payments", d).then(r => r.data),
  delete: (id: string) => api.delete(`/payments/${id}`).then(r => r.data),
};

export const notifyApi = {
  whatsapp: (entryId: string) => api.post(`/notify/whatsapp/${entryId}`).then(r => r.data),
  sms: (entryId: string) => api.post(`/notify/sms/${entryId}`).then(r => r.data),
};

export const superAdminApi = {
  stats: () => api.get("/superadmin/stats").then(r => r.data),
  dairies: () => api.get("/superadmin/dairies").then(r => r.data),
  getDairy: (id: string) => api.get(`/superadmin/dairies/${id}`).then(r => r.data),
  getDairyReport: (id: string, params?: { period?: string; from?: string; to?: string }) =>
    api.get(`/superadmin/dairies/${id}/report`, { params }).then(r => r.data),
  createDairy: (d: unknown) => api.post("/superadmin/dairies", d).then(r => r.data),
  updateDairy: (id: string, d: unknown) => api.put(`/superadmin/dairies/${id}`, d).then(r => r.data),
  toggleDairy: (id: string) => api.patch(`/superadmin/dairies/${id}/toggle`).then(r => r.data),
  deleteDairy: (id: string) => api.delete(`/superadmin/dairies/${id}`).then(r => r.data),
  updateRates: (id: string, d: unknown) => api.put(`/superadmin/dairies/${id}/rates`, d).then(r => r.data),
  changeAdminPassword: (dairyId: string, adminId: string, newPassword: string) =>
    api.patch(`/superadmin/dairies/${dairyId}/admin/${adminId}/password`, { newPassword }).then(r => r.data),
};