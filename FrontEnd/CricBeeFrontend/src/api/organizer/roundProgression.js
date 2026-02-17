import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Save qualified teams for the next round
export const saveQualifiedTeams = async (tournamentId, fromRound, toRound, clubIds) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/round_progression/tournament/${tournamentId}/save-qualified-teams`,
      {
        from_round: fromRound,
        to_round: toRound,
        club_ids: clubIds
      },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error saving qualified teams:', error);
    throw error;
  }
};

// Get qualified teams for a specific round progression
export const getQualifiedTeams = async (tournamentId, fromRound, toRound) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/round_progression/tournament/${tournamentId}/qualified-teams`,
      {
        params: { from_round: fromRound, to_round: toRound },
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching qualified teams:', error);
    throw error;
  }
};

// Get all qualified teams for a specific target round
export const getAllQualifiedForRound = async (tournamentId, toRound) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/round_progression/tournament/${tournamentId}/all-qualified-for-round/${toRound}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching all qualified teams:', error);
    throw error;
  }
};

// Complete tournament with winner (for Round 3)
export const completeTournamentWithWinner = async (tournamentId, winnerTeamId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/round_progression/tournament/${tournamentId}/complete-with-winner`,
      { winner_team_id: winnerTeamId },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error completing tournament:', error);
    throw error;
  }
};
