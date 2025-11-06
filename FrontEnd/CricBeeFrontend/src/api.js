import axios from "axios";

const BASE_URL=import.meta.env.VITE_BASE_URL

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-CSRFToken": getCookie("csrftoken"),
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Include CSRF token manually if needed
        const csrfToken = getCookie("csrftoken");

         await axios.post(
          `${BASE_URL}/refresh_token/`,{}, {
            headers: {
              "X-CSRFToken": csrfToken,
            },
            withCredentials: true,
          });

        // Optionally update tokens or anything if needed from response
        return api(originalRequest);
      } catch (refreshError) {
        try {
          await axios.post(`${BASE_URL}/logout/`, {}, {
            headers: {
              "X-CSRFToken": getCookie("csrftoken"),
            },
            withCredentials: true,
          });
        } catch (logoutError) {
          console.error("Logout failed:", logoutError);
        }

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
