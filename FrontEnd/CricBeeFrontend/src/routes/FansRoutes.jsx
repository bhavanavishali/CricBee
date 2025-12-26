import { Route, Routes } from "react-router-dom";

import { FanProtectedRoute } from "../components/ProtectedRoute";

import FansDashboard from "@/pages/fans/Dashboard"
import ExploreMatches from "@/pages/fans/ExploreMatches"

const FansRoutes = () => {
  return (
    <Routes>
        <Route path="dashboard" element={<FanProtectedRoute><FansDashboard /></FanProtectedRoute>} />
        <Route path="matches" element={<FanProtectedRoute><ExploreMatches /></FanProtectedRoute>} />
    </Routes>
  );
};

export default FansRoutes;
