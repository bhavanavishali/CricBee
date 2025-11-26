

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
import { updateUser } from "@/store/slices/authSlice";
function App() {
  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Role Based Routes */}
        
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/organizer/*" element={<OrganizerRoutes />} />
        <Route path="/club_manager/*" element={<ClubManagerRoutes />} />
        <Route path="/player/*" element={<PlayerRoutes />} />
        <Route path="/fans/*" element={<FanRoutes />} />
        
      </Routes>
    </Router>
  );
}

export default App;
