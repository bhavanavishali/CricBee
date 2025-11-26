
// "use client";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { setUser, setLoading } from "@/store/slices/authSlice";
// import { signIn } from "@/api/authService";

// export default function SignInPage() {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const loading = useSelector((state) => state.auth.loading);
  
//   const [formData, setFormData] = useState({
//     role: "",
//     email_or_phone: "test@example.com",
//     password: "123456",
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

  
//   const handleDemoLogin = async (demoRole) => {
//     if (loading) return;
    
//     dispatch(setLoading(true));
   
//     const demoUsers = {
//       "Demo Admin": { id: 1, full_name: "Demo Admin", email: "admin@example.com", phone: "", role: "admin" },
//       "Demo Organizer": { id: 2, full_name: "Demo Organizer", email: "organizer@example.com", phone: "", role: "organizer" },
//       "Demo Manager": { id: 3, full_name: "Demo Manager", email: "manager@example.com", phone: "", role: "club_manager" },
//       "Demo Player": { id: 4, full_name: "Demo Player", email: "player@example.com", phone: "", role: "player" },
//     };
    
//     const demoUser = demoUsers[demoRole];
//     if (demoUser) {
//       dispatch(setUser(demoUser));
//       // Redirect based on role
//       let redirectPath = "/";
//       if (demoUser.role === "organizer") {
//         redirectPath = "/organizer/dashboard";
//       } else if (demoUser.role === "club_manager") {
//         redirectPath = "/club_manager/dashboard";
//       } else if (demoUser.role === "player") {
//         redirectPath = "/player/dashboard";
//       } else if (demoUser.role === "fan") {
//         redirectPath = "/";
//       } else if (demoUser.role === "admin") {
//         redirectPath = "/admin/dashboard";  // Assume admin path
//       }
//       navigate(redirectPath, { replace: true });
//     }
//     dispatch(setLoading(false));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!formData.role) {
//       alert("Please select a role before signing in.");
//       return;
//     }
    
//     dispatch(setLoading(true));
//     try {
//       const response = await signIn(formData);
//       console.log("Sign in response:", response);
      
//       if (response && response.success) {
//         // Store user in Redux (full_name as "name")
//         if (response.user) {
//           dispatch(setUser(response.user));
//           console.log("User set in Redux (name:", response.user.full_name, ", role:", response.user.role, "):", response);
//         }
        
//         // Redirect based on selected role
//         const selectedRole = formData.role;
//         let redirectPath = "/";
        
//         if (selectedRole === "organizer") {
//           redirectPath = "/organizer/dashboard";
//         } else if (selectedRole === "club_manager") {  // Match backend role
//           redirectPath = "/club_manager/dashboard";
//         } else if (selectedRole === "player") {
//           redirectPath = "/player/dashboard";
//         } else if (selectedRole === "fan") {
//           redirectPath = "/";
//         }
        
//         console.log("Redirecting to:", redirectPath);
//         navigate(redirectPath, { replace: true });
//       } else {
//         alert(response?.message || "Invalid credentials");
//       }
//     } catch (err) {
//       console.error("Sign in error:", err);
//       alert(err.message || "Sign in failed. Please try again.");
//     } finally {
//       dispatch(setLoading(false));
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
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

//       <div className="flex items-center justify-center py-12 px-4">
//         <div className="bg-gray-300 rounded-3xl w-full max-w-3xl p-8 md:p-12">
//           <div className="grid md:grid-cols-2 gap-8">
//             {/* <div className="flex flex-col gap-4">
//               <h3 className="text-lg font-semibold text-orange-600 mb-4">Demo Roles</h3>
//               {["Demo Admin", "Demo Organizer", "Demo Manager", "Demo Player"].map((role) => (
//                 <button
//                   key={role}
//                   onClick={() => handleDemoLogin(role)}
//                   className="px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition text-left"
//                   disabled={loading}
//                 >
//                   {role}
//                 </button>
//               ))}
//             </div> */}

//             <div>
//               <h2 className="text-3xl font-bold text-orange-600 mb-2">Welcome to CricB!</h2>
//               <p className="text-gray-600 mb-6">Login/Signup to get exclusive CricB privileges!</p>

//               <form onSubmit={handleSubmit} className="space-y-6">
//                 <div>
//                   <label className="block text-orange-600 font-medium mb-2">
//                     Select Your Role
//                   </label>
//                   <select
//                     name="role"
//                     value={formData.role}
//                     onChange={handleChange}
//                     className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 focus:outline-none focus:border-orange-500 text-gray-700"
//                     disabled={loading}
//                     required
//                   >
//                     <option value="">Choose Your Role</option>
//                     <option value="organizer">Organizer</option>
//                     <option value="club_manager">Club Manager</option>  {/* Match backend */}
//                     <option value="player">Player</option>
//                     <option value="fan">Fan</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-orange-600 font-medium mb-2">Email or Phone</label>
//                   <input
//                     type="text"
//                     name="email_or_phone"
//                     value={formData.email_or_phone}
//                     onChange={handleChange}
//                     placeholder="Enter your email or phone"
//                     className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
//                     disabled={loading}
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-orange-600 font-medium mb-2">Password</label>
//                   <input
//                     type="password"
//                     name="password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     placeholder="Enter your password"
//                     className="w-full px-4 py-3 bg-white rounded-lg border border-gray-400 placeholder-gray-500 focus:outline-none focus:border-orange-500"
//                     disabled={loading}
//                   />
//                 </div>

//                 {/* <div className="text-right">
//                   <a href="#" className="text-blue-500 text-sm hover:text-blue-700">
//                     Forgot password?
//                   </a>
//                 </div> */}

//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition text-lg disabled:opacity-50"
//                 >
//                   {loading ? "Signing In..." : "SignIn"}
//                 </button>
//               </form>

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
//   );
// }