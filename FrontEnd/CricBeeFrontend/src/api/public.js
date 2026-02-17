import api from '@/api';

// Public tournament endpoints
export const getPublicTournaments = async (statusFilter = null) => {
  const url = statusFilter 
    ? `/public/tournaments?status_filter=${statusFilter}`
    : '/public/tournaments';
  const response = await api.get(url);
  return response.data;
};

export const getPublicTournamentDetails = async (tournamentId) => {
  const response = await api.get(`/public/tournaments/${tournamentId}`);
  return response.data;
};

// Public match endpoints
export const getPublicScoreboard = async (matchId) => {
  const response = await api.get(`/public/matches/${matchId}/scoreboard`);
  return response.data;
};

export const getLiveMatches = async () => {
  const response = await api.get('/public/matches/live');
  return response.data;
};

