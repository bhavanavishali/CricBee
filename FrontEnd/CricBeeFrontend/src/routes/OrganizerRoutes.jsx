import { Route, Routes } from "react-router-dom";
import {OrganizerProtectedRoute} from "@/components/ProtectedRoute";

import OrganizerDashboard from "@/pages/organizer/Dashboard"
import ProfilePage from "../pages/organizer/Profile"
import CreateTournament from "@/pages/organizer/CreateTournament"
import TournamentList from "@/pages/organizer/TournamentList"

const OrganizerRoutes = () => {
  return (
    <Routes>
        <Route path="dashboard" element={<OrganizerProtectedRoute><OrganizerDashboard /></OrganizerProtectedRoute>} />
        <Route path="profile" element={<OrganizerProtectedRoute><ProfilePage /></OrganizerProtectedRoute>} />
        <Route path="create-tournament" element={<OrganizerProtectedRoute><CreateTournament /></OrganizerProtectedRoute>} />
        <Route path="tournaments" element={<OrganizerProtectedRoute><TournamentList /></OrganizerProtectedRoute>} />
    </Routes>
  );
};

export default OrganizerRoutes;
