import api from '@/api';

export const getPointTable = async (tournamentId) => {
  try {
    const response = await api.get(`/point_table/tournament/${tournamentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching points table:', error);
    throw error;
  }
};

export const initializePointTable = async (tournamentId) => {
  try {
    const response = await api.post(`/point_table/tournament/${tournamentId}/initialize`, {});
    return response.data;
  } catch (error) {
    console.error('Error initializing points table:', error);
    throw error;
  }
};

export const resetPointTable = async (tournamentId) => {
  try {
    const response = await api.delete(`/point_table/tournament/${tournamentId}/reset`);
    return response.data;
  } catch (error) {
    console.error('Error resetting points table:', error);
    throw error;
  }
};

export const updatePointTableForMatch = async (matchId) => {
  try {
    const response = await api.post(`/point_table/match/${matchId}/update`, {});
    return response.data;
  } catch (error) {
    console.error('Error updating points table for match:', error);
    throw error;
  }
};
