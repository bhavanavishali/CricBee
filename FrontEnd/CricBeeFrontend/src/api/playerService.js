// src/services/playerServices.js
import api from '@/api'; // Adjust path as needed

export const getPlayerProfile = async () => {
  try {
    const response = await api.get(`/player-profile/`);
    const data = response.data;
    console.log("Player profile data***********:", data);
    return {
      success: true,
      profile: data, // PlayerProfileResponse: { user: UserRead, player_profile: PlayerRead | null }
    };
  } catch (error) {
    console.error("Get player profile error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Network error.",
    };
  }
};

export const createPlayerProfile = async (payload) => {
  try {
    const response = await api.post(`/player-profile/player`, payload);
    const data = response.data;
    return {
      success: true,
      message: "Player profile created successfully",
      player_profile: data, // PlayerRead
    };
  } catch (error) {
    console.error("Create player profile error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Network error.",
    };
  }
};

export const updatePlayerProfile = async (playerId, payload) => {
  try {
    const response = await api.put(`/player-profile/player/${playerId}`, payload);
    const data = response.data;
    return {
      success: true,
      message: "Player profile updated successfully",
      player_profile: data, // PlayerRead
    };
  } catch (error) {
    console.error("Update player profile error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Network error.",
    };
  }
};