import { Route, Routes } from "react-router-dom";
import {OrganizerProtectedRoute} from "@/components/ProtectedRoute";

import OrganizerDashboard from "@/pages/organizer/Dashboard"
import ProfilePage from "../pages/organizer/Profile"
import CreateTournament from "@/pages/organizer/CreateTournament"
import TournamentList from "@/pages/organizer/TournamentList"
import OrganizerTransactions from "@/pages/organizer/Transactions"
import TournamentEnrollments from "@/pages/organizer/TournamentEnrollments"
import EnrolledClubs from "@/pages/organizer/EnrolledClubs"
import ManageFixtures from "@/pages/organizer/ManageFixtures"
import TournamentFixtures from "@/pages/organizer/TournamentFixtures"
import Toss from "@/pages/organizer/Toss"
import LiveScoring from "@/pages/organizer/LiveScoring"

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
        <Route path="manage-fixtures" element={<OrganizerProtectedRoute><ManageFixtures /></OrganizerProtectedRoute>} />
        <Route path="tournaments/:tournamentId/fixtures" element={<OrganizerProtectedRoute><TournamentFixtures /></OrganizerProtectedRoute>} />
        <Route path="matches/:matchId/toss" element={<OrganizerProtectedRoute><Toss /></OrganizerProtectedRoute>} />
        <Route path="matches/:matchId/live-scoring" element={<OrganizerProtectedRoute><LiveScoring /></OrganizerProtectedRoute>} />
    </Routes>
  );
};

export default OrganizerRoutes;
