import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Get points table for a tournament
export const getPointTable = async (tournamentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/point_table/tournament/${tournamentId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching points table:', error);
    throw error;
  }
};

// Initialize points table for a tournament
export const initializePointTable = async (tournamentId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/point_table/tournament/${tournamentId}/initialize`, {}, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error initializing points table:', error);
    throw error;
  }
};

// Reset points table for a tournament
export const resetPointTable = async (tournamentId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/point_table/tournament/${tournamentId}/reset`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error resetting points table:', error);
    throw error;
  }
};

// Update points table for a match
export const updatePointTableForMatch = async (matchId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/point_table/match/${matchId}/update`, {}, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating points table for match:', error);
    throw error;
  }
};
