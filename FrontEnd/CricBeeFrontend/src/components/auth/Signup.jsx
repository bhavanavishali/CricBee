// "use client"

// import { useState } from "react"
// import { signUp } from "@/api/authService"

// export default function SignUpPage() {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     mobileNumber: "",
//     password: "",
//     confirmPassword: "",
//     role: "",
//   })

//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }))
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     if (formData.password !== formData.confirmPassword) {
//       alert("Passwords do not match")
//       return
//     }
//     try {
//       const { confirmPassword, ...payload } = formData
//       const response = await signUp(payload)
//       if (response.success) {
//         if (response.token) {
//           localStorage.setItem("token", response.token)
//         }
//         if (response.user) {
//           localStorage.setItem("user", JSON.stringify(response.user))
//         }
//         window.location.href = "/"
//       } else {
//         alert(response.message || "Sign up failed")
//       }
//     } catch (err) {
//       alert(err.message || "Sign up failed. Please try again.")
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* Header */}
//       <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
//         <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center">
//               <span className="text-white font-bold text-sm">CB</span>
//             </div>
//             <span className="font-semibold text-lg">CricB</span>
//           </div>
//           <div className="flex items-center gap-3">
//             <a href="/" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
//               Back to Home
//             </a>
//           </div>
//         </nav>
//       </header>

//       {/* Sign Up Page */}
//       <div className="flex items-center justify-center py-12 px-4">
//         <div className="bg-gray-300 rounded-3xl w-full max-w-3xl p-8 md:p-12">
//           <h2 className="text-3xl font-bold text-orange-600 mb-2 text-center">Welcome to CricB!</h2>
//           <p className="text-gray-600 mb-8 text-center">Login/Signup to get exclusive CricB privileges!</p>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="grid md:grid-cols-2 gap-6">
//               {/* Name */}
//               <div>
//                 <label className="block text-orange-600 font-medium mb-2">Name</label>
//                 <input
//                   type="text"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   placeholder="Enter your Name"
//                   className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
//                 />
//               </div>

//               {/* Password */}
//               <div>
//                 <label className="block text-orange-600 font-medium mb-2">Password</label>
//                 <input
//                   type="password"
//                   name="password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   placeholder="Enter Your Password"
//                   className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
//                 />
//               </div>

//               {/* Email */}
//               <div>
//                 <label className="block text-orange-600 font-medium mb-2">Email</label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   placeholder="Enter Email"
//                   className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
//                 />
//               </div>

//               {/* Confirm Password */}
//               <div>
//                 <label className="block text-orange-600 font-medium mb-2">Confirm Password</label>
//                 <input
//                   type="password"
//                   name="confirmPassword"
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                   placeholder="Confirm Your Password"
//                   className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
//                 />
//               </div>

//               {/* Mobile Number */}
//               <div>
//                 <label className="block text-orange-600 font-medium mb-2">Mobile Number</label>
//                 <input
//                   type="tel"
//                   name="mobileNumber"
//                   value={formData.mobileNumber}
//                   onChange={handleChange}
//                   placeholder="Enter your Name"
//                   className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
//                 />
//               </div>

//               {/* Role Selection */}
//               <div>
//                 <label className="block text-orange-600 font-medium mb-2">Choose Your Role</label>
//                 <select
//                   name="role"
//                   value={formData.role}
//                   onChange={handleChange}
//                   className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 focus:outline-none focus:border-orange-500 text-gray-500"
//                 >
//                   <option value="">Choose Your Role</option>
//                   <option value="organizer">Organizer</option>
//                   <option value="manager">Club Manager</option>
//                   <option value="player">Player</option>
//                   <option value="fan">Fan</option>
//                 </select>
//               </div>
//             </div>

//             {/* Sign Up Button */}
//             <button
//               type="submit"
//               className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition text-lg"
//             >
//               SignUP
//             </button>

//             {/* Terms & Conditions */}
//             <p className="text-center text-gray-600 text-sm">
//               *By continuing, I agree to <span className="text-blue-500 cursor-pointer hover:text-blue-700">T&C</span>
//             </p>
//           </form>

//           {/* Sign In Link */}
//           <p className="text-center text-gray-600 mt-6">
//             Already have an account?{" "}
//             <a href="/signin" className="text-orange-500 hover:text-orange-600 font-medium">
//               Sign In
//             </a>
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// }

"use client"

import { useState } from "react"
import { signUp } from "@/api/authService" // ensure this returns a promise
import Dashboard from "../../pages/organizer/Dashboard"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    role: "",
  })

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    // ✅ Validation checks
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.")
      return
    }

    if (!formData.role) {
      alert("Please select a role.")
      return
    }

    try {
      // ✅ Transform payload to match backend model
      const payload = {
        full_name: formData.name,
        email: formData.email,
        phone: formData.mobileNumber,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        role: roleMap[formData.role] || formData.role,
      }

      // ✅ Call API
      const response = await signUp(payload)

      // If using Axios, response.data contains actual data
      const data = response?.data || response

      if (data?.success) {
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user))
        }
        // Redirect to sign-in page
        window.location.href =
          "/organizer/dashboard"
      } else {
        alert(data?.message || "Signup failed. Please try again.")
      }
    } catch (err) {
      console.error("Signup Error:", err)
      alert(err?.response?.data?.message || err.message || "Signup failed. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">CB</span>
            </div>
            <span className="font-semibold text-lg">CricB</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Back to Home
            </a>
          </div>
        </nav>
      </header>

      {/* Signup Form */}
      <div className="flex items-center justify-center py-12 px-4">
        <div className="bg-gray-300 rounded-3xl w-full max-w-3xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-orange-600 mb-2 text-center">
            Welcome to CricB!
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Login/Signup to get exclusive CricB privileges!
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-orange-600 font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your Name"
                  className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-orange-600 font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter Your Password"
                  className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-orange-600 font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter Email"
                  className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-orange-600 font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Your Password"
                  className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-orange-600 font-medium mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="Enter your Mobile Number"
                  pattern="[0-9]{10}"
                  className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-orange-600 font-medium mb-2">
                  Choose Your Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 focus:outline-none focus:border-orange-500 text-gray-500"
                  required
                >
                  <option value="">Choose Your Role</option>
                  <option value="organizer">Organizer</option>
                  <option value="manager">Club Manager</option>
                  <option value="fan">Fan</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition text-lg"
            >
              Sign Up
            </button>

            {/* Terms */}
            <p className="text-center text-gray-600 text-sm">
              *By continuing, I agree to{" "}
              <span className="text-blue-500 cursor-pointer hover:text-blue-700">
                T&C
              </span>
            </p>
          </form>

          {/* Sign In link */}
          <p className="text-center text-gray-600 mt-6">
            Already have an account?{" "}
            <a
              href="/signin"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
