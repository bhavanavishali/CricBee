import { Route, Routes } from "react-router-dom";

import { ClubManagerProtectedRoute } from "../components/ProtectedRoute";

import ClubManagerDashboard from "@/pages/clubmanager/Dashboard"

const ClubManagerRoutes = () => {
  return (
    <Routes>
            <Route path="dashboard" element={<ClubManagerProtectedRoute><ClubManagerDashboard /></ClubManagerProtectedRoute>} />
    </Routes>
  );
};

export default ClubManagerRoutes;
