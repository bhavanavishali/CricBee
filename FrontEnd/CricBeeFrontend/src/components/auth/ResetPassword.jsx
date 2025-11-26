"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { resetPassword } from "@/api/authService"
import { ArrowLeft } from "lucide-react"
import Swal from "sweetalert2"

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  })
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState("")

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (!tokenParam) {
      Swal.fire({
        icon: "error",
        title: "Invalid Link",
        text: "No reset token found. Please request a new password reset.",
        confirmButtonColor: "#14b8a6",
      }).then(() => {
        navigate("/forgot-password")
      })
    } else {
      setToken(tokenParam)
    }
  }, [searchParams, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.password || !formData.confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please fill in all fields.",
        confirmButtonColor: "#14b8a6",
      })
      return
    }

    if (formData.password.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Password Too Short",
        text: "Password must be at least 6 characters long.",
        confirmButtonColor: "#14b8a6",
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Passwords Don't Match",
        text: "Please make sure both passwords match.",
        confirmButtonColor: "#14b8a6",
      })
      return
    }

    setLoading(true)
    try {
      const response = await resetPassword(token, formData.password)
      
      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Password Reset!",
          text: response.message,
          confirmButtonColor: "#14b8a6",
        }).then(() => {
          navigate("/signin")
        })
      } else {
        Swal.fire({
          icon: "error",
          title: "Reset Failed",
          text: response.message,
          confirmButtonColor: "#14b8a6",
        })
      }
    } catch (err) {
      console.error("Reset password error:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to reset password. The link may have expired. Please request a new one.",
        confirmButtonColor: "#14b8a6",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Back Button - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => navigate("/signin")}
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

          {/* Reset Password Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-teal-600 mb-2">Reset Password</h1>
            <p className="text-gray-600 mb-6">
              Enter your new password below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            {/* Sign In Link */}
            <p className="text-center text-gray-600 mt-6 text-sm">
              Remember your password?{" "}
              <button
                onClick={() => navigate("/signin")}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


