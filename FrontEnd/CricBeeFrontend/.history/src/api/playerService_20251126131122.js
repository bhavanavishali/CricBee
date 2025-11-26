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

export const uploadProfilePhoto = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/player-profile/upload-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const data = response.data;
    return {
      success: true,
      message: data.message || "Profile photo uploaded successfully",
      profile_photo: data.profile_photo,
    };
  } catch (error) {
    console.error("Upload profile photo error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Failed to upload photo.",
    };
  }
};

export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  try {
    const response = await api.post(`/player-profile/change-password`, {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    const data = response.data;
    return {
      success: true,
      message: data.message || "Password changed successfully",
    };
  } catch (error) {
    console.error("Change password error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Failed to change password.",
    };
  }
};