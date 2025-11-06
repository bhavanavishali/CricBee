
// "use client"
// import { useState } from "react"
// import { signIn } from "@/api/authService"



// export default function SignInPage() {
//   const [formData, setFormData] = useState({
//     username: "",
//     password: "",
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
//     try {
//       const response = await signIn(formData)
//       if (response.success) {
//         if (response.token) {
//           localStorage.setItem("token", response.token)
//         }
//         if (response.user) {
//           localStorage.setItem("user", JSON.stringify(response.user))
//         }
//         window.location.href = "/"
//       } else {
//         alert(response.message || "Invalid credentials")
//       }
//     } catch (err) {
//       alert(err.message || "Sign in failed. Please try again.")
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

//       {/* Sign In Page */}
//       <div className="flex items-center justify-center py-12 px-4">
//         <div className="bg-gray-300 rounded-3xl w-full max-w-3xl p-8 md:p-12">
//           <div className="grid md:grid-cols-2 gap-8">
//             {/* Demo Roles Sidebar */}
//             <div className="flex flex-col gap-4">
//               <h3 className="text-lg font-semibold text-orange-600 mb-4">Demo Roles</h3>
//               {["Demo Admin", "Demo Organizer", "Demo Manager", "Demo Player"].map((role) => (
//                 <button
//                   key={role}
//                   className="px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition text-left"
//                 >
//                   {role}
//                 </button>
//               ))}
//             </div>

//             {/* Sign In Form */}
//             <div>
//               <h2 className="text-3xl font-bold text-orange-600 mb-2">Welcome to CricB!</h2>
//               <p className="text-gray-600 mb-6">Login/Signup to get exclusive CricB privileges!</p>

//               <form onSubmit={handleSubmit} className="space-y-6">
//                 {/* Username */}
//                 <div>
//                   <label className="block text-orange-600 font-medium mb-2">Username</label>
//                   <input
//                     type="text"
//                     name="username"
//                     value={formData.username}
//                     onChange={handleChange}
//                     placeholder="Enter your Name"
//                     className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
//                   />
//                 </div>

//                 {/* Password */}
//                 <div>
//                   <label className="block text-orange-600 font-medium mb-2">Password</label>
//                   <input
//                     type="password"
//                     name="password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     placeholder="Enter Email"
//                     className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
//                   />
//                 </div>

//                 {/* Forgot Password Link */}
//                 <div className="text-right">
//                   <a href="#" className="text-blue-500 text-sm hover:text-blue-700">
//                     Forgot password?
//                   </a>
//                 </div>

//                 {/* Sign In Button */}
//                 <button
//                   type="submit"
//                   className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition text-lg"
//                 >
//                   SignIn
//                 </button>
//               </form>

//               {/* Sign Up Link */}
//               <p className="text-center text-gray-600 mt-6">
//                 Don't have an account?{" "}
//                 <a href="/signup" className="text-orange-500 hover:text-orange-600 font-medium">
//                   Sign Up
//                 </a>
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }


"use client"
import { useState } from "react"
import { signIn } from "@/api/authService"

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email_or_phone: "test@example.com",
    password: "123456",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await signIn(formData)
      if (response.success) {
        if (response.token) {
          localStorage.setItem("token", response.token)
        }
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user))
        }
        window.location.href = "/"
      } else {
        alert(response.message || "Invalid credentials")
      }
    } catch (err) {
      alert(err.message || "Sign in failed. Please try again.")
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
            <a href="/" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
              Back to Home
            </a>
          </div>
        </nav>
      </header>

      {/* Sign In Page */}
      <div className="flex items-center justify-center py-12 px-4">
        <div className="bg-gray-300 rounded-3xl w-full max-w-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Demo Roles Sidebar */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-orange-600 mb-4">Demo Roles</h3>
              {["Demo Admin", "Demo Organizer", "Demo Manager", "Demo Player"].map((role) => (
                <button
                  key={role}
                  className="px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition text-left"
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Sign In Form */}
            <div>
              <h2 className="text-3xl font-bold text-orange-600 mb-2">Welcome to CricB!</h2>
              <p className="text-gray-600 mb-6">Login/Signup to get exclusive CricB privileges!</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email or Phone */}
                <div>
                  <label className="block text-orange-600 font-medium mb-2">Email or Phone</label>
                  <input
                    type="text"
                    name="email_or_phone"
                    value={formData.email_or_phone}
                    onChange={handleChange}
                    placeholder="Enter your email or phone"
                    className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-orange-600 font-medium mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <a href="#" className="text-blue-500 text-sm hover:text-blue-700">
                    Forgot password?
                  </a>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition text-lg"
                >
                  SignIn
                </button>
              </form>

              {/* Sign Up Link */}
              <p className="text-center text-gray-600 mt-6">
                Don't have an account?{" "}
                <a href="/signup" className="text-orange-500 hover:text-orange-600 font-medium">
                  Sign Up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}