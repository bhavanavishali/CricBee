

"use client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setUser, setLoading } from "@/store/slices/authSlice";
import { signIn } from "@/api/authService";
import Swal from "sweetalert2";

export default function AdminSignInPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.auth.loading);
  
  const [formData, setFormData] = useState({
    role: "admin",  // Fixed for admin
    email_or_phone: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDemoLogin = async () => {
    if (loading) return;
    
    dispatch(setLoading(true));
   
    const demoUser = { 
      id: 1, 
      full_name: "Demo Admin", 
      email: "admin@example.com", 
      phone: "", 
      role: "admin",  // Changed to lowercase to match form
      is_superuser: true 
    };
    
    dispatch(setUser(demoUser));
    navigate("/admin/dashboard", { replace: true });
    dispatch(setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    dispatch(setLoading(true));
    try {
      const response = await signIn(formData);
      console.log("Admin sign in response:", response);
      
      // Check if signin was successful (authService returns { success, message, user })
      if (response && response.success && response.user) {
        // Store user in Redux
        dispatch(setUser(response.user));
        console.log("Admin user set in Redux:", response.user);
        
        // Verify user has admin role before redirecting
        if (response.user.role === "admin" || response.user.is_superuser) {
          navigate("/admin/dashboard", { replace: true });
        } else {
          Swal.fire({ icon: 'warning', title: 'Access Denied', text: 'Admin privileges required.' });
          dispatch(setLoading(false));
        }
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: response?.message || "Invalid admin credentials" });
        dispatch(setLoading(false));
      }
    } catch (err) {
      console.error("Admin sign in error:", err);
      Swal.fire({ icon: 'error', title: 'Error!', text: err.message || "Admin sign in failed. Please try again." });
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">CB</span>
            </div>
            <span className="font-semibold text-lg">CricB Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
              Back to Home
            </a>
          </div>
        </nav>
      </header>

      <div className="flex items-center justify-center py-12 px-4">
        <div className="bg-gray-300 rounded-3xl w-full max-w-md p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-red-600 mb-2">Admin Login</h2>
            <p className="text-gray-600">Access the admin control panel</p>
          </div>

          {/* Demo Button */}
          <div className="mb-6">
            <button
              onClick={handleDemoLogin}
              className="w-full px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Loading..." : "Demo Admin Login"}
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-400"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-300 text-gray-600">Or sign in with credentials</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-red-600 font-medium mb-2">Email or Phone</label>
              <input
                type="text"
                name="email_or_phone"
                value={formData.email_or_phone}
                onChange={handleChange}
                placeholder="Enter admin email or phone"
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-red-500"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-red-600 font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-red-500"
                disabled={loading}
                required
              />
            </div>

            <div className="text-right">
              <a href="#" className="text-blue-500 text-sm hover:text-blue-700">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition text-lg disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Admin Sign In"}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Back to regular login?{" "}
            <a href="/signin" className="text-red-500 hover:text-red-600 font-medium">
              User Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}