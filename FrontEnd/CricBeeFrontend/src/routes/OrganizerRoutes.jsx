import { Route, Routes } from "react-router-dom";
import {OrganizerProtectedRoute} from "@/components/ProtectedRoute";

import OrganizerDashboard from "@/pages/organizer/Dashboard"
import ProfilePage from "../pages/organizer/Profile"

const OrganizerRoutes = () => {
  return (
    <Routes>
        <Route path="dashboard" element={<OrganizerProtectedRoute><OrganizerDashboard /></OrganizerProtectedRoute>} />
        <Route path="profile" element={<OrganizerProtectedRoute><ProfilePage /></OrganizerProtectedRoute>} />
    </Routes>
  );
};

export default OrganizerRoutes;
