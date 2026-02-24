

"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { signUp, verifyOTP, resendOTP } from "@/api/authService"
import { X, ArrowLeft, ChevronDown, Eye, EyeOff } from "lucide-react"
import Swal from "sweetalert2"

export default function SignUpPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    role: "",
  })

  const [showOTPModal, setShowOTPModal] = useState(false)
  const [otp, setOtp] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [resendTimer, setResendTimer] = useState(0)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Role mapping to match backend literals
  const roleMap = {
    organizer: "Organizer",
    manager: "Club Manager",
    player: "Player",
    fan: "Fan",
  }

  const startResendTimer = () => {
    setResendTimer(60)
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validation checks
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Passwords do not match.' })
      setLoading(false)
      return
    }

    if (!formData.role) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please select a role.' })
      setLoading(false)
      return
    }

    if (!agreeToTerms) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please agree to the Terms and Conditions.' })
      setLoading(false)
      return
    }

    try {
      // Transform payload to match backend model
      const payload = {
        full_name: formData.name,
        email: formData.email,
        phone: formData.mobileNumber,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        role: roleMap[formData.role] || formData.role,
      }

      // Call signup API
      const response = await signUp(payload)

      if (response.success) {
        // Store email for OTP verification
        setUserEmail(formData.email)
        // Show OTP modal
        setShowOTPModal(true)
        // Start resend timer (60 seconds)
        startResendTimer()
        Swal.fire({ icon: 'success', title: 'Success!', text: response.message || "Signup successful! Please check your email for OTP." })
      } else {
        Swal.fire({ icon: 'error', title: 'Error!', text: response.message || "Signup failed. Please try again." })
      }
    } catch (err) {
      console.error("Signup Error:", err)
      Swal.fire({ icon: 'error', title: 'Error!', text: "Signup failed. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setOtpError("")

    if (otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP")
      setLoading(false)
      return
    }

    try {
      const response = await verifyOTP(userEmail, otp)

      if (response.success) {
        await Swal.fire({ icon: 'success', title: 'Success!', text: response.message || "Email verified successfully! You can now sign in." })
        setShowOTPModal(false)
        // Redirect to sign-in page
        navigate("/signin")
      } else {
        setOtpError(response.message || "Invalid OTP. Please try again.")
      }
    } catch (err) {
      console.error("OTP Verification Error:", err)
      setOtpError("Invalid or expired OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0) return

    setLoading(true)
    setOtpError("")

    try {
      const response = await resendOTP(userEmail)

      if (response.success) {
        Swal.fire({ icon: 'success', title: 'Success!', text: response.message || "OTP has been resent to your email!" })
        setOtp("")
        startResendTimer()
      } else {
        setOtpError(response.message || "Failed to resend OTP")
      }
    } catch (err) {
      console.error("Resend OTP Error:", err)
      setOtpError("Failed to resend OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setOtp(value)
    setOtpError("")
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
          {/* Logo and Title Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img 
                src="/Image (1).png" 
                alt="CricB Logo" 
                className="w-12 h-12 object-contain"
              />
              <span className="font-bold text-2xl text-gray-900">CricB</span>
            </div>
            <h1 className="text-3xl font-bold text-teal-600 mb-2">Join CricB</h1>
            <p className="text-gray-600">Create your account to get started</p>
          </div>

          {/* Signup Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  pattern="[0-9]{10}"
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
                    placeholder="Create a password"
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Role Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white text-gray-700"
                    required
                    disabled={loading}
                  >
                    <option value="">Select your role</option>
                    <option value="organizer">Organizer</option>
                    <option value="manager">Club Manager</option>
                    <option value="player">Player</option>
                    <option value="fan">Fan</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  disabled={loading}
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-teal-600 hover:text-teal-700 font-medium"
                    onClick={(e) => {
                      e.preventDefault()
                      // Add terms and conditions modal or page navigation here
                    }}
                  >
                    Terms and Conditions
                  </a>
                </label>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading || !agreeToTerms}
                className="w-full py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* Sign In Link */}
            <p className="text-center text-gray-600 mt-6 text-sm">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/signin")}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => {
                setShowOTPModal(false)
                setOtp("")
                setOtpError("")
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-teal-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Verify Your Email
              </h3>
              <p className="text-gray-600 text-sm">
                We've sent a 6-digit OTP to
              </p>
              <p className="text-teal-600 font-medium">{userEmail}</p>
            </div>

            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-center">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={handleOTPChange}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest bg-gray-50 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-teal-500"
                  disabled={loading}
                  autoFocus
                />
                {otpError && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    {otpError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-gray-600 text-sm">
                    Resend OTP in{" "}
                    <span className="font-semibold text-teal-600">
                      {resendTimer}s
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-teal-600 hover:text-teal-700 font-medium text-sm disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </form>

            <p className="text-gray-500 text-xs text-center mt-6">
              Didn't receive the code? Check your spam folder or try resending.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}