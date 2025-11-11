import { Route, Routes } from "react-router-dom";

import { FanProtectedRoute } from "../components/ProtectedRoute";

import PlayerDashboard from "@/pages/player/Dashboard"

const PlayerRoutes= () => {
  return (
    <Routes>
        <Route path="dashboard" element={<FanProtectedRoute><PlayerDashboard /></FanProtectedRoute>} />
    </Routes>
  );
};

export default PlayerRoutes;
