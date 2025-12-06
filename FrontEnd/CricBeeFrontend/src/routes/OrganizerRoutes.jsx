import { Route, Routes } from "react-router-dom";
import {OrganizerProtectedRoute} from "@/components/ProtectedRoute";

import OrganizerDashboard from "@/pages/organizer/Dashboard"
import ProfilePage from "../pages/organizer/Profile"
import CreateTournament from "@/pages/organizer/CreateTournament"
import TournamentList from "@/pages/organizer/TournamentList"
import OrganizerTransactions from "@/pages/organizer/Transactions"
import TournamentEnrollments from "@/pages/organizer/TournamentEnrollments"
import EnrolledClubs from "@/pages/organizer/EnrolledClubs"

const OrganizerRoutes = () => {
  return (
    <Routes>
        <Route path="dashboard" element={<OrganizerProtectedRoute><OrganizerDashboard /></OrganizerProtectedRoute>} />
        <Route path="profile" element={<OrganizerProtectedRoute><ProfilePage /></OrganizerProtectedRoute>} />
        <Route path="create-tournament" element={<OrganizerProtectedRoute><CreateTournament /></OrganizerProtectedRoute>} />
        <Route path="tournaments" element={<OrganizerProtectedRoute><TournamentList /></OrganizerProtectedRoute>} />
        <Route path="transactions" element={<OrganizerProtectedRoute><OrganizerTransactions /></OrganizerProtectedRoute>} />
        <Route path="tournament-enrollments" element={<OrganizerProtectedRoute><TournamentEnrollments /></OrganizerProtectedRoute>} />
        <Route path="tournaments/:tournamentId/enrolled-clubs" element={<OrganizerProtectedRoute><EnrolledClubs /></OrganizerProtectedRoute>} />
    </Routes>
  );
};

export default OrganizerRoutes;
