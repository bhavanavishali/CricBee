import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Check if all matches in a round are completed
export const checkRoundStatus = async (roundId, tournamentId) => {
  try {
    const url = tournamentId 
      ? `${API_BASE_URL}/round_completion/round/${roundId}/status?tournament_id=${tournamentId}`
      : `${API_BASE_URL}/round_completion/round/${roundId}/status`;
    
    const response = await axios.get(url, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error checking round status:', error);
    throw error;
  }
};

// Add club to Round 2
export const addClubToRoundTwo = async (tournamentId, clubId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/round_completion/tournament/${tournamentId}/add-club/${clubId}`,
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding club to Round 2:', error);
    throw error;
  }
};

// Remove club from Round 2
export const removeClubFromRoundTwo = async (tournamentId, clubId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/round_completion/tournament/${tournamentId}/remove-club/${clubId}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error removing club from Round 2:', error);
    throw error;
  }
};

// Get clubs selected for Round 2
export const getRoundTwoClubs = async (tournamentId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/round_completion/tournament/${tournamentId}/round-two-clubs`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching Round 2 clubs:', error);
    throw error;
  }
};
