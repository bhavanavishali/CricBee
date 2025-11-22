import { Route, Routes } from "react-router-dom";

import { PlayerProtectedRoute } from "../components/ProtectedRoute";

import PlayerDashboard from "@/pages/player/Dashboard"
import ProfilePage from "../pages/player/Profile";

const PlayerRoutes= () => {
  return (
    <Routes>
    <Route path="dashboard" element={<PlayerProtectedRoute><PlayerDashboard /></PlayerProtectedRoute>} />
    <Route path="profile" element={<PlayerProtectedRoute><ProfilePage /></PlayerProtectedRoute>} />
    </Routes>
  );
};

export default PlayerRoutes;
