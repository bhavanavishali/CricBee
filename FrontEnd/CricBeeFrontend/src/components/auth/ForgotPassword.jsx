"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { forgotPassword } from "@/api/authService"
import { ArrowLeft } from "lucide-react"
import Swal from "sweetalert2"

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) {
      Swal.fire({
        icon: "warning",
        title: "Email Required",
        text: "Please enter your email address.",
        confirmButtonColor: "#14b8a6",
      })
      return
    }

    setLoading(true)
    try {
      const response = await forgotPassword(email)
      
      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Email Sent!",
          text: response.message,
          confirmButtonColor: "#14b8a6",
        }).then(() => {
          navigate("/signin")
        })
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message,
          confirmButtonColor: "#14b8a6",
        })
      }
    } catch (err) {
      console.error("Forgot password error:", err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to send reset link. Please try again.",
        confirmButtonColor: "#14b8a6",
      })
    } finally {
      setLoading(false)
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

          {/* Forgot Password Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-teal-600 mb-2">Forgot Password?</h1>
            <p className="text-gray-600 mb-6">
              Enter your registered email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
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


