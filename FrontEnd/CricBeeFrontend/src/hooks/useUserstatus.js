import { useEffect } from "react";
import { useSelector } from "react-redux";
import { clearUser } from "@/store/slices/authSlice";
import store from "@/store/store";
import api from "@/api";

export const useUserStatusCheck = () => {
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user) return;

    // Get endpoint based on user role
    const getStatusCheckEndpoint = (role) => {
      const roleLower = role?.toLowerCase() || "";
      switch (roleLower) {
        case "admin":
          return "/admin/users";
        case "organizer":
          return "/tournaments/";
        case "club_manager":
        case "club manager":
          return "/club-profile/";
        case "player":
          return "/player-profile/";
        case "fan":
          return "/api/v1/fans/tournaments/";
        default:
          return "/api/v1/fans/tournaments/";
      }
    };

    const interval = setInterval(async () => {
      try {
        const endpoint = getStatusCheckEndpoint(user.role);
        await api.get(endpoint);
      } catch (error) {
        // Only handle 401 (unauthorized) - means token expired or invalid
        // Ignore 403 (forbidden) - means user is authenticated but doesn't have permission (expected for non-admin users)
        if (error.response?.status === 401) {
          const errorMessage = error.response?.data?.detail || "";
          if (errorMessage.includes("inactive") || 
              errorMessage.includes("User account is inactive") ||
              errorMessage.includes("Could not validate credentials")) {
            store.dispatch(clearUser());
            localStorage.removeItem("persist:root");
            document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            localStorage.removeItem("user");
         
            if (window.location.pathname !== "/signin" && 
                !window.location.pathname.includes("/admin/signin")) {
              window.location.href = "/signin";
            }
          }
        }
        // Silently ignore 403 errors - they're expected for non-admin users
      }
    }, 30000); 

    return () => clearInterval(interval);
  }, [user]); 
};