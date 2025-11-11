import { Route, Routes } from "react-router-dom";

import { PlayerProtectedRoute } from "../components/ProtectedRoute";

import PlayerDashboard from "@/pages/player/Dashboard"

const PlayerRoutes= () => {
  return (
    <Routes>
    <Route path="dashboard" element={<PlayerProtectedRoute><PlayerDashboard /></PlayerProtectedRoute>} />
    </Routes>
  );
};

export default PlayerRoutes;
