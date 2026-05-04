import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Attach patient token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("patient_token");
  if (token) {
    config.headers["X-Patient-Token"] = token;
  }
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("patient_token");
      localStorage.removeItem("patient_info");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
