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

export const getRoundMatches = async (roundId, tournamentId) => {
  const response = await api.get(`/fixtures/rounds/${roundId}/matches?tournament_id=${tournamentId}`);
  return response.data;
};

export const getTournamentMatches = async (tournamentId) => {
  const response = await api.get(`/fixtures/tournaments/${tournamentId}/matches`);
  return response.data;
};

export const toggleMatchPublish = async (matchId) => {
  const response = await api.patch(`/fixtures/matches/${matchId}/toggle-publish`);
  return response.data;
};

export const initializeLeagueFixtures = async (tournamentId) => {
  const response = await api.post(`/fixtures/tournaments/${tournamentId}/league/initialize`);
  return response.data;
};

export const generateLeagueMatches = async (roundId, tournamentId) => {
  const response = await api.post(`/fixtures/rounds/${roundId}/league/generate-matches?tournament_id=${tournamentId}`);
  return response.data;
};

export const getLeagueStandings = async (tournamentId, roundId) => {
  const response = await api.get(`/fixtures/tournaments/${tournamentId}/rounds/${roundId}/standings`);
  return response.data;
};

export const getQualifiedTeams = async (tournamentId, topN = 4) => {
  const response = await api.get(`/fixtures/tournaments/${tournamentId}/qualified-teams`, {
    params: { top_n: topN }
  });
  return response.data;
};

export const updateMatchDetails = async (matchId, matchData) => {
  const response = await api.patch(`/fixtures/matches/${matchId}/details`, matchData);
  return response.data;
};

export const getFixtureModes = async () => {
  const response = await api.get('/fixtures/fixture-modes');
  return response.data;
};

export const setTournamentFixtureMode = async (tournamentId, fixtureModeId) => {
  const response = await api.post(`/fixtures/tournaments/${tournamentId}/set-fixture-mode`, {
    fixture_mode_id: fixtureModeId
  });
  return response.data;
};

export const initializeDefaultRounds = async (tournamentId) => {
  const response = await api.post(`/fixtures/tournaments/${tournamentId}/initialize-rounds`);
  return response.data;
};

export const updateRoundName = async (roundId, roundName) => {
  const response = await api.patch(`/fixtures/rounds/${roundId}/name`, {
    round_name: roundName
  });
  return response.data;
};

export const generateSemiFinals = async (tournamentId) => {
  const response = await api.post(`/fixtures/tournaments/${tournamentId}/generate-semi-finals`);
  return response.data;
};

export const generateFinal = async (tournamentId) => {
  const response = await api.post(`/fixtures/tournaments/${tournamentId}/generate-final`);
  return response.data;
};

