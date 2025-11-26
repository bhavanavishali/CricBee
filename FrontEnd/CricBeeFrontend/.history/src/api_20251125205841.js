// import axios from "axios";

// const BASE_URL ="http://localhost:8000"

// const api = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
    
//   },
//   withCredentials: true,  
// });
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // Only attempt refresh if:
//     // 1. Status is 401
//     // 2. Request hasn't been retried yet
//     // 3. Request is NOT the refresh endpoint itself
//     // 4. Request is NOT signin/signup (to avoid loops)
//     if (error.response?.status === 401 && 
//         !originalRequest._retry && 
//         !originalRequest.url?.includes('/auth/refresh') &&
//         !originalRequest.url?.includes('/auth/signin') &&
//         !originalRequest.url?.includes('/auth/signup')) {
      
//       originalRequest._retry = true;
      
//       try {
//         // Attempt to refresh token
//         const refreshResponse = await api.post(`${BASE_URL}/auth/refresh`, {}, {
//           withCredentials: true
//         });
        
//         // If refresh succeeds, retry original request
//         if (refreshResponse.status === 200) {
//           // Remove Authorization header if present (we use cookies)
//           delete originalRequest.headers.Authorization;
//           return api(originalRequest);
//         }
//       } catch (refreshError) {
//         // Refresh failed - clear storage and redirect to signin
//         console.error("Token refresh failed:", refreshError);
//         localStorage.removeItem("user");
//         // Clear any remaining cookies
//         document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
//         document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        
//         // Only redirect if not already on signin page
//         if (window.location.pathname !== '/signin') {
//           window.location.href = "/signin";
//         }
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// function getCookie(name) {
//   const value = `; ${document.cookie}`;
//   const parts = value.split(`; ${name}=`);
//   if (parts.length === 2) return parts.pop().split(";").shift();
// }

// export default api;

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
        // Clear user state from Redux
        store.dispatch(clearUser());
        
        // Clear cookies
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        
        // Clear localStorage
        localStorage.removeItem("user");
        
        // Redirect to signin page if not already there
        if (window.location.pathname !== "/signin" && 
            !window.location.pathname.includes("/admin/signin")) {
          window.location.href = "/signin";
        }
        
        return Promise.reject(error);
      }
    }

    // Handle 401 Unauthorized - Token refresh logic
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes("/auth/refresh") &&
        !originalRequest.url?.includes("/auth/signin") &&
        !originalRequest.url?.includes("/auth/signup")) {
      
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
            store.dispatch(clearUser());
            document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            localStorage.removeItem("user");
            
            if (window.location.pathname !== "/signin" && 
                !window.location.pathname.includes("/admin/signin")) {
              window.location.href = "/signin";
            }
          }
        }
        
        // Refresh failed - clear storage and redirect to signin
        console.error("Token refresh failed:", refreshError);
        store.dispatch(clearUser());
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        localStorage.removeItem("user");
        
        // Only redirect if not already on signin page
        if (window.location.pathname !== "/signin" && 
            !window.location.pathname.includes("/admin/signin")) {
          window.location.href = "/signin";
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