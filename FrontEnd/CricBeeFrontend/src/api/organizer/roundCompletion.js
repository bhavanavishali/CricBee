import api from '@/api';

export const checkRoundStatus = async (roundId, tournamentId) => {
  try {
    const url = tournamentId 
      ? `/round_completion/round/${roundId}/status?tournament_id=${tournamentId}`
      : `/round_completion/round/${roundId}/status`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error checking round status:', error);
    throw error;
  }
};

export const addClubToRoundTwo = async (tournamentId, clubId) => {
  try {
    const response = await api.post(
      `/round_completion/tournament/${tournamentId}/add-club/${clubId}`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error adding club to Round 2:', error);
    throw error;
  }
};

export const removeClubFromRoundTwo = async (tournamentId, clubId) => {
  try {
    const response = await api.delete(
      `/round_completion/tournament/${tournamentId}/remove-club/${clubId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error removing club from Round 2:', error);
    throw error;
  }
};

export const getRoundTwoClubs = async (tournamentId) => {
  try {
    const response = await api.get(
      `/round_completion/tournament/${tournamentId}/round-two-clubs`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching Round 2 clubs:', error);
    throw error;
  }
};
