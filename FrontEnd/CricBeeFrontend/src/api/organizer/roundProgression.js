import api from '@/api';

export const saveQualifiedTeams = async (tournamentId, fromRound, toRound, clubIds) => {
  try {
    const response = await api.post(
      `/round_progression/tournament/${tournamentId}/save-qualified-teams`,
      {
        from_round: fromRound,
        to_round: toRound,
        club_ids: clubIds
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error saving qualified teams:', error);
    throw error;
  }
};

export const getQualifiedTeams = async (tournamentId, fromRound, toRound) => {
  try {
    const response = await api.get(
      `/round_progression/tournament/${tournamentId}/qualified-teams`,
      { params: { from_round: fromRound, to_round: toRound } }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching qualified teams:', error);
    throw error;
  }
};

export const getAllQualifiedForRound = async (tournamentId, toRound) => {
  try {
    const response = await api.get(
      `/round_progression/tournament/${tournamentId}/all-qualified-for-round/${toRound}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching all qualified teams:', error);
    throw error;
  }
};

export const completeTournamentWithWinner = async (tournamentId, winnerTeamId) => {
  try {
    const response = await api.post(
      `/round_progression/tournament/${tournamentId}/complete-with-winner`,
      { winner_team_id: winnerTeamId }
    );
    return response.data;
  } catch (error) {
    console.error('Error completing tournament:', error);
    throw error;
  }
};
