import { useEffect } from "react";
import { useSelector } from "react-redux";
import { clearUser } from "@/store/slices/authSlice";
import store from "@/store/store";
import api from "@/api";

export const useUserStatusCheck = () => {
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
     
        await api.get("/admin/users"); // Use any protected endpoint
      } catch (error) {
    
        if (error.response?.status === 403 || error.response?.status === 401) {
          const errorMessage = error.response?.data?.detail || "";
          if (errorMessage.includes("inactive") || 
              errorMessage.includes("User account is inactive")) {
            store.dispatch(clearUser());
            localStorage.removeItem("persist:root");
            document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            localStorage.removeItem("user");
            // Use window.location.href instead of navigate since we're outside Router context
            if (window.location.pathname !== "/signin" && 
                !window.location.pathname.includes("/admin/signin")) {
              window.location.href = "/signin";
            }
          }
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user]); // Removed navigate from dependencies
};