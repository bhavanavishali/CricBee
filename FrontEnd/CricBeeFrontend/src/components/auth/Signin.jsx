
"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { setUser, setLoading } from "@/store/slices/authSlice"
import { signIn } from "@/api/authService"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import Swal from "sweetalert2"

export default function SignInPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const loading = useSelector((state) => state.auth.loading)
  
  const [formData, setFormData] = useState({
    email_or_phone: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Helper function to get redirect path based on role
  const getRedirectPath = (role) => {
    const roleLower = role?.toLowerCase() || ""
    
    if (roleLower === "admin") {
      return "/admin/dashboard"
    } else if (roleLower === "organizer") {
      return "/organizer/dashboard"
    } else if (roleLower === "club_manager" || roleLower === "club manager") {
      return "/clubmanager/dashboard"
    } else if (roleLower === "player") {
      return "/player/dashboard"
    } else if (roleLower === "fan") {
      return "/fans/dashboard"
    }
    return "/"
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.email_or_phone || !formData.password) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in all required fields.",
        confirmButtonColor: "#14b8a6",
      })
      return
    }
    
    dispatch(setLoading(true))
    try {
      const response = await signIn(formData)
      console.log("Sign in response:", response)
      
      if (response && response.success) {
        // Store user in Redux
        if (response.user) {
          dispatch(setUser(response.user))
          console.log("User set in Redux (name:", response.user.full_name, ", role:", response.user.role, "):", response)
          
          // Show success message
          Swal.fire({
            icon: "success",
            title: "Welcome Back!",
            text: `Signed in successfully as ${response.user.full_name || "User"}`,
            confirmButtonColor: "#14b8a6",
            timer: 2000,
            showConfirmButton: true,
          }).then(() => {
            // Get redirect path based on user's role from backend
            const userRole = response.user.role
            const redirectPath = getRedirectPath(userRole)
            
            console.log("Redirecting to:", redirectPath, "based on role:", userRole)
            navigate(redirectPath, { replace: true })
          })
        } else {
          Swal.fire({
            icon: "warning",
            title: "Sign In Successful",
            text: "Sign in successful, but user data not received.",
            confirmButtonColor: "#14b8a6",
          })
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Sign In Failed",
          text: response?.message || "Invalid credentials. Please check your email/phone and password.",
          confirmButtonColor: "#14b8a6",
        })
      }
    } catch (err) {
      console.error("Sign in error:", err)
      
      // Determine error message
      let errorMessage = "Sign in failed. Please try again."
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err.message) {
        errorMessage = err.message
      }
      
      Swal.fire({
        icon: "error",
        title: "Sign In Error",
        text: errorMessage,
        confirmButtonColor: "#14b8a6",
      })
    } finally {
      dispatch(setLoading(false))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen py-12 px-4">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img 
                src="/Image (1).png" 
                alt="CricB Logo" 
                className="w-12 h-12 object-contain"
              />
              <span className="font-bold text-2xl text-gray-900">CricB</span>
            </div>
          </div>

          {/* Sign-in Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-teal-600 mb-2">Welcome Back</h1>
            <p className="text-gray-600 mb-6">Sign in to your CricB account</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email or Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email or Phone
                </label>
                <input
                  type="text"
                  name="email_or_phone"
                  value={formData.email_or_phone}
                  onChange={handleChange}
                  placeholder="Enter your email or phone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="text-center text-gray-600 mt-6 text-sm">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}