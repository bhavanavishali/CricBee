// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
// import Home from "@/components/common/Home"
// import SignIn from "@/components/auth/Signin"
// import SignUp from "@/components/auth/Signup"
// import OrganizerDashboard from "@/pages/organizer/Dashboard"
// import ClubManagerDashboard from "@/pages/clubmanager/Dashboard"
// import PlayerDashboard from "@/pages/player/Dashboard"
// import ProfilePage from "../pages/organizer/Profile"
// import {
//   AdminProtectedRoute,
//   OrganizerProtectedRoute,
//   ClubManagerProtectedRoute,
//   PlayerProtectedRoute,
//   FanProtectedRoute,
//   MultiRoleProtectedRoute,
// } from "@/components/ProtectedRoute";

// const AppRoutes = () => {
//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* Public Routes */}
//         <Route path="/" element={<Home />} />
//         <Route path="/signin" element={<SignIn />} />
//         <Route path="/signup" element={<SignUp />} />
        
//         {/* Dashboard Routes */}
//         <Route path="/organizer/dashboard" element={<OrganizerProtectedRoute><OrganizerDashboard /></OrganizerProtectedRoute>} />
//         <Route path="/organizer/profile" element={<OrganizerProtectedRoute><ProfilePage /></OrganizerProtectedRoute>} />
//         <Route path="/club_manager/dashboard" element={<ClubManagerProtectedRoute><ClubManagerDashboard /></ClubManagerProtectedRoute>} />
//         <Route path="/player/dashboard" element={<PlayerProtectedRoute><PlayerDashboard /></PlayerProtectedRoute>} />
        

//       </Routes>
//     </BrowserRouter>
//   )
// }

// export default AppRoutes


