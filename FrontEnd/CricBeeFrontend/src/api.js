



import axios from "axios";
import store from "@/store/store";
import { clearUser } from "@/store/slices/authSlice";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;



const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});


const handleUserBlocked = () => {
  
  store.dispatch(clearUser());
  
  
  localStorage.removeItem("persist:root");
  
 
  document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  
  
  localStorage.removeItem("user");
  
  
  if (window.location.pathname !== "/signin" && 
      !window.location.pathname.includes("/admin/signin")) {
    window.location.href = "/signin";
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.detail || "";
      
      
      if (errorMessage.includes("User account is inactive") || 
          errorMessage.includes("inactive")) {
        handleUserBlocked();
        return Promise.reject(error);
      }
    }

    
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes("/auth/refresh") &&
        !originalRequest.url?.includes("/auth/signin") &&
        !originalRequest.url?.includes("/auth/signup") &&
        !originalRequest.url?.includes("/public/")) {  
      
      originalRequest._retry = true;
      
      try {
        
        const refreshResponse = await api.post(`${BASE_URL}/auth/refresh`, {}, {
          withCredentials: true
        });
        
        
        if (refreshResponse.status === 200) {
          delete originalRequest.headers.Authorization;
          return api(originalRequest);
        }
      } catch (refreshError) {
       
        if (refreshError.response?.status === 401 || 
            refreshError.response?.status === 403) {
          const refreshErrorMessage = refreshError.response?.data?.detail || "";
          
          if (refreshErrorMessage.includes("inactive") || 
              refreshErrorMessage.includes("User account is inactive")) {
            
            handleUserBlocked();
            return Promise.reject(refreshError);
          }
        }
        
       
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