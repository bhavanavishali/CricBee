import api from '@/api';

// Public tournament endpoints
export const getPublicTournaments = async (statusFilter = null) => {
  const url = statusFilter 
    ? `/api/v1/public/tournaments?status_filter=${statusFilter}`
    : '/api/v1/public/tournaments';
  const response = await api.get(url);
  return response.data;
};

export const getPublicTournamentDetails = async (tournamentId) => {
  const response = await api.get(`/api/v1/public/tournaments/${tournamentId}`);
  return response.data;
};

// Public match endpoints
export const getPublicScoreboard = async (matchId) => {
  const response = await api.get(`/api/v1/public/matches/${matchId}/scoreboard`);
  return response.data;
};

export const getLiveMatches = async () => {
  const response = await api.get('/api/v1/public/matches/live');
  return response.data;
};

