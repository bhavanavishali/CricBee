import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Home from "@/components/common/Home"
import SignIn from "@/components/auth/Signin"
import SignUp from "@/components/auth/Signup"
import OrganizerDashboard from "@/pages/organizer/Dashboard"
import ClubManagerDashboard from "@/pages/clubmanager/Dashboard"
import PlayerDashboard from "@/pages/player/Dashboard"


const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* Dashboard Routes */}
        <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
        <Route path="/club_manager/dashboard" element={<ClubManagerDashboard />} />
        <Route path="/player/dashboard" element={<PlayerDashboard />} />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes


