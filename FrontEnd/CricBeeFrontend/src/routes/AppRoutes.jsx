import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Home from "@/components/common/Home"
import SignIn from "@/components/auth/Signin"
import SignUp from "@/components/auth/Signup"
import Dashboard from "@/pages/organizer/Dashboard"


const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/organizer/dashboard" element={<Dashboard />} />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes


