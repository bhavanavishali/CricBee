import api from '@/api';

export const checkCanCreateFixture = async (tournamentId) => {
  const response = await api.get(`/fixtures/tournaments/${tournamentId}/can-create`);
  return response.data;
};

export const createFixtureRound = async (roundData) => {
  const response = await api.post('/fixtures/rounds', roundData);
  return response.data;
};

export const getTournamentRounds = async (tournamentId) => {
  const response = await api.get(`/fixtures/tournaments/${tournamentId}/rounds`);
  return response.data;
};

export const createMatch = async (matchData) => {
  const response = await api.post('/fixtures/matches', matchData);
  return response.data;
};

export const getRoundMatches = async (roundId) => {
  const response = await api.get(`/fixtures/rounds/${roundId}/matches`);
  return response.data;
};

export const getTournamentMatches = async (tournamentId) => {
  const response = await api.get(`/fixtures/tournaments/${tournamentId}/matches`);
  return response.data;
};

