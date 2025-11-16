import { Route, Routes } from "react-router-dom";

import { ClubManagerProtectedRoute } from "../components/ProtectedRoute";

import ClubManagerDashboard from "@/pages/clubmanager/Dashboard"
import ProfilePage from "../pages/clubmanager/Profile"

const ClubManagerRoutes = () => {
  return (
    <Routes>
            <Route path="dashboard" element={<ClubManagerProtectedRoute><ClubManagerDashboard /></ClubManagerProtectedRoute>} />
            <Route path="profile" element={<ClubManagerProtectedRoute><ProfilePage  /></ClubManagerProtectedRoute>} />
    </Routes>
  );
};

export default ClubManagerRoutes;
