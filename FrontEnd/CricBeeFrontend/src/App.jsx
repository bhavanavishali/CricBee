

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminRoutes from "@/routes/AdminRoutes";
import OrganizerRoutes from "./routes/OrganizerRoutes";
import ClubManagerRoutes from "./routes/ClubManagerRoutes";
import PlayerRoutes from "./routes/PlayerRoutes";
import FanRoutes from "./routes/FansRoutes";
import "./App.css"
import Home from "@/components/common/Home"
import SignIn from "@/components/auth/Signin"
import SignUp from "@/components/auth/Signup"
import ForgotPassword from "@/components/auth/ForgotPassword"
import ResetPassword from "@/components/auth/ResetPassword"
import {useUserStatusCheck} from "@/api/useUserstatus";
function App() {
  useUserStatusCheck();

  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Role Based Routes */}
        
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/organizer/*" element={<OrganizerRoutes />} />
        <Route path="/clubmanager/*" element={<ClubManagerRoutes />} />
        <Route path="/player/*" element={<PlayerRoutes />} />
        <Route path="/fans/*" element={<FanRoutes />} />
        
      </Routes>
    </Router>
  );
}

export default App;
