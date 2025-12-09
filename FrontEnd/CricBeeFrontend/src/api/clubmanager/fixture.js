import api from '@/api';

export const getMyFixtures = async () => {
  const response = await api.get('/club-profile/fixtures');
  return response.data;
};

export const getClubPlayersForMatch = async (matchId) => {
  const response = await api.get(`/club-profile/fixtures/${matchId}/players`);
  return response.data;
};

export const setPlayingXI = async (matchId, playerIds, captainId = null, viceCaptainId = null) => {
  const response = await api.post(`/club-profile/fixtures/${matchId}/playing-xi`, {
    player_ids: playerIds,
    captain_id: captainId,
    vice_captain_id: viceCaptainId
  });
  return response.data;
};

export const getPlayingXI = async (matchId) => {
  const response = await api.get(`/club-profile/fixtures/${matchId}/playing-xi`);
  return response.data;
};

