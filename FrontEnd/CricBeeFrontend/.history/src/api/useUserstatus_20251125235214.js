import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearUser } from "@/store/slices/authSlice";
import store from "@/store/store";
import api from "@/api";

export const useUserStatusCheck = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user) return;

    // Check user status every 30 seconds
    const interval = setInterval(async () => {
      try {
        // Make a lightweight API call that requires authentication
        // This will trigger the interceptor if user is blocked
        await api.get("/admin/users"); // Use any protected endpoint
      } catch (error) {
        // The interceptor will handle the logout
        // This is just a fallback
        if (error.response?.status === 403 || error.response?.status === 401) {
          const errorMessage = error.response?.data?.detail || "";
          if (errorMessage.includes("inactive") || 
              errorMessage.includes("User account is inactive")) {
            store.dispatch(clearUser());
            localStorage.removeItem("persist:root");
            document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            localStorage.removeItem("user");
            navigate("/signin");
          }
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, navigate]);
};