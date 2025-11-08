import axios from "axios";

const BASE_URL ="http://localhost:8000"

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    // "X-CSRFToken": getCookie("csrftoken"),  // Uncomment if using CSRF middleware
  },
  withCredentials: true,  // Crucial: Sends/receives cookies automatically
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Refresh: Backend reads refresh_token cookie, sets new ones
        await api.post("/auth/refresh");
        // Retry with new cookies (auto-sent)
        originalRequest.headers.Authorization = undefined;  // Not needed; cookies handle auth
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed: Clear local user, redirect to signin
        localStorage.removeItem("user");
        window.location.href = "/signin";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

export default api;