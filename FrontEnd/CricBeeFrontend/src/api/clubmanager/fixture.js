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

export const getClubPlayers = async () => {
  try {
    console.log('=== API: Starting getClubPlayers ===')
    
    // Use the new simple endpoint that doesn't require club ID
    const response = await api.get('/club-profile/players');
    console.log('=== API: Raw response received ===')
    console.log('Response status:', response.status)
    console.log('Response data:', response.data)
    
    // Check if response has the expected structure
    if (response.data && typeof response.data === 'object') {
      console.log('=== API: Response structure analysis ===')
      console.log('Has players property:', 'players' in response.data)
      console.log('Players type:', typeof response.data.players)
      console.log('Players is array:', Array.isArray(response.data.players))
      console.log('Players length:', response.data.players?.length)
      console.log('Has total property:', 'total' in response.data)
      
      return {
        success: true,
        data: response.data
      };
    } else {
      console.log('=== API: Unexpected response structure ===')
      return {
        success: false,
        message: "Unexpected response structure",
        data: { players: [], total: 0 }
      };
    }
  } catch (error) {
    console.log('=== API: Exception occurred ===')
    console.error('Error:', error)
    console.error('Error response:', error?.response)
    console.error('Error status:', error?.response?.status)
    console.error('Error data:', error?.response?.data)
    
    return {
      success: false,
      message: error?.response?.data?.detail || error?.message || "Failed to fetch club players",
      data: { players: [], total: 0 }
    };
  }
};

