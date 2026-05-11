import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Attach patient JWT as Bearer token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("patient_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle errors gracefully
api.interceptors.response.use(
  (res) => {
    // If the server returned HTML instead of JSON (proxy error / backend down),
    // convert it to a proper error so the app doesn't crash with a MIME error.
    const contentType = res.headers?.["content-type"] || "";
    if (
      contentType.includes("text/html") &&
      typeof res.data === "string" &&
      res.data.trim().startsWith("<")
    ) {
      return Promise.reject(
        new Error("Server returned an unexpected response. The backend may be unavailable.")
      );
    }
    return res;
  },
  (err) => {
    // 401 → clear session and redirect to login
    if (err.response?.status === 401) {
      localStorage.removeItem("patient_token");
      localStorage.removeItem("patient_info");
      window.location.href = "/login";
      return Promise.reject(err);
    }

    // If the error response is HTML (Vercel proxy error page), replace with a
    // human-readable message so the app shows an error state instead of crashing.
    const contentType = err.response?.headers?.["content-type"] || "";
    if (contentType.includes("text/html")) {
      const humanError = new Error(
        "Cannot reach the server. Please check your connection or try again later."
      );
      humanError.response = err.response;
      return Promise.reject(humanError);
    }

    return Promise.reject(err);
  }
);

export default api;
