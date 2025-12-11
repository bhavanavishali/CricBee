import api from '@/api';

// Toss operations
export const updateToss = async (matchId, tossData) => {
  const response = await api.post(`/matches/${matchId}/toss`, tossData);
  return response.data;
};

// Match operations
export const startMatch = async (matchId) => {
  const response = await api.post(`/matches/${matchId}/start`);
  return response.data;
};

export const endInnings = async (matchId) => {
  const response = await api.post(`/matches/${matchId}/end-innings`);
  return response.data;
};

// Scoreboard operations
export const getScoreboard = async (matchId) => {
  const response = await api.get(`/matches/${matchId}/scoreboard`);
  return response.data;
};

export const updateScore = async (matchId, scoreData) => {
  const response = await api.post(`/matches/${matchId}/score`, scoreData);
  return response.data;
};





