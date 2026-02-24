import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = axios.create({ baseURL: `${BACKEND_URL}/api` });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("marketai_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isAuthCheck = err.config?.url?.includes("/auth/me");
      if (!isAuthCheck) {
        localStorage.removeItem("marketai_token");
        localStorage.removeItem("marketai_user");
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post("/auth/register", data),
  login: (data) => API.post("/auth/login", data),
  me: () => API.get("/auth/me"),
};

// Content
export const contentAPI = {
  generate: (data) => API.post("/content/generate", data),
  list: () => API.get("/content"),
  delete: (id) => API.delete(`/content/${id}`),
};

// Campaigns
export const campaignAPI = {
  create: (data) => API.post("/campaigns", data),
  list: () => API.get("/campaigns"),
  update: (id, data) => API.put(`/campaigns/${id}`, data),
  updateStatus: (id, status) => API.patch(`/campaigns/${id}/status`, { status }),
};

// Analytics
export const analyticsAPI = {
  overview: () => API.get("/analytics/overview"),
  trends: () => API.get("/analytics/trends"),
};

// Insights
export const insightsAPI = {
  list: () => API.get("/insights"),
  generate: () => API.post("/insights/generate"),
  ask: (question) => API.post("/insights/ask", { question }),
};

// Channels
export const channelsAPI = {
  list: () => API.get("/channels"),
  connect: (data) => API.post("/channels/connect", data),
  disconnect: (id) => API.delete(`/channels/${id}`),
};

// Schedule
export const scheduleAPI = {
  create: (data) => API.post("/schedule", data),
  list: () => API.get("/schedule"),
  cancel: (id) => API.delete(`/schedule/${id}`),
};

// Payments
export const paymentsAPI = {
  checkout: (data) => API.post("/payments/checkout", data),
  status: (sessionId) => API.get(`/payments/status/${sessionId}`),
  mobile: (data) => API.post("/payments/mobile", data),
  history: () => API.get("/payments/history"),
};

// Dashboard
export const dashboardAPI = {
  summary: () => API.get("/dashboard/summary"),
};

// Workspace
export const workspaceAPI = {
  get: () => API.get("/workspace"),
};

export default API;
