



import axios from "axios";
import store from "@/store/store";
import { clearUser } from "@/store/slices/authSlice";

const BASE_URL = "http://localhost:8000";



const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Helper function to clear all user data and redirect
const handleUserBlocked = () => {
  // Clear user state from Redux
  store.dispatch(clearUser());
  
  // Clear redux-persist storage
  localStorage.removeItem("persist:root");
  
  // Clear cookies
  document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  
  // Clear any other localStorage items
  localStorage.removeItem("user");
  
  // Redirect to signin page if not already there
  if (window.location.pathname !== "/signin" && 
      !window.location.pathname.includes("/admin/signin")) {
    window.location.href = "/signin";
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 403 Forbidden - User account is inactive (blocked)
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.detail || "";
      
      // Check if user was blocked
      if (errorMessage.includes("User account is inactive") || 
          errorMessage.includes("inactive")) {
        handleUserBlocked();
        return Promise.reject(error);
      }
    }

    // Handle 401 Unauthorized - Token refresh logic
    // Skip token refresh for public endpoints
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes("/auth/refresh") &&
        !originalRequest.url?.includes("/auth/signin") &&
        !originalRequest.url?.includes("/auth/signup") &&
        !originalRequest.url?.includes("/public/")) {  // Skip public endpoints
      
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const refreshResponse = await api.post(`${BASE_URL}/auth/refresh`, {}, {
          withCredentials: true
        });
        
        // If refresh succeeds, retry original request
        if (refreshResponse.status === 200) {
          delete originalRequest.headers.Authorization;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Check if refresh failed due to inactive user
        if (refreshError.response?.status === 401 || 
            refreshError.response?.status === 403) {
          const refreshErrorMessage = refreshError.response?.data?.detail || "";
          
          if (refreshErrorMessage.includes("inactive") || 
              refreshErrorMessage.includes("User account is inactive")) {
            // User was blocked during session
            handleUserBlocked();
            return Promise.reject(refreshError);
          }
        }
        
        // Refresh failed - clear storage and redirect to signin
        // But don't redirect if on public pages
        if (!window.location.pathname.startsWith('/tournaments') && 
            !window.location.pathname.startsWith('/matches') &&
            !window.location.pathname.startsWith('/live-matches') &&
            window.location.pathname !== '/') {
          console.error("Token refresh failed:", refreshError);
          handleUserBlocked();
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