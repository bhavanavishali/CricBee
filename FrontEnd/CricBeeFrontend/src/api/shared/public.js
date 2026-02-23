import api from '@/api';

// Public tournament endpoints (fans API)
export const getPublicTournaments = async (statusFilter = null) => {
  const url = statusFilter 
    ? `/api/v1/fans/tournaments/?status_filter=${statusFilter}`
    : '/api/v1/fans/tournaments/';
  const response = await api.get(url);
  return response.data;
};

export const getPublicTournamentDetails = async (tournamentId) => {
  const response = await api.get(`/api/v1/fans/tournaments/${tournamentId}`);
  return response.data;
};

// Public match endpoints (fans API)
export const getPublicScoreboard = async (matchId) => {
  const response = await api.get(`/api/v1/fans/matches/${matchId}/scoreboard`);
  return response.data;
};

export const getLiveMatches = async () => {
  const response = await api.get('/api/v1/fans/matches/live');
  return response.data;
};

