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

// Get available players
export const getAvailableBatsmen = async (matchId, teamId) => {
  const response = await api.get(`/matches/${matchId}/available-batsmen?team_id=${teamId}`);
  return response.data;
};

export const getAvailableBowlers = async (matchId, teamId, excludeBowlerId = null) => {
  const url = excludeBowlerId 
    ? `/matches/${matchId}/available-bowlers?team_id=${teamId}&exclude_bowler_id=${excludeBowlerId}`
    : `/matches/${matchId}/available-bowlers?team_id=${teamId}`;
  const response = await api.get(url);
  return response.data;
};

export const validateBowler = async (matchId, bowlerId) => {
  const response = await api.post(`/matches/${matchId}/validate-bowler?bowler_id=${bowlerId}`);
  return response.data;
};

export const setBatsmen = async (matchId, strikerId, nonStrikerId) => {
  const response = await api.post(`/matches/${matchId}/set-batsmen`, {
    striker_id: strikerId,
    non_striker_id: nonStrikerId
  });
  return response.data;
};

export const setBowler = async (matchId, bowlerId) => {
  const response = await api.post(`/matches/${matchId}/set-bowler`, {
    bowler_id: bowlerId
  });
  return response.data;
};

export const getMatchWinner = async (matchId) => {
  const response = await api.get(`/matches/${matchId}/winner`);
  return response.data;
};


