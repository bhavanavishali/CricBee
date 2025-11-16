// src/services/clubServices.js
import api from '@/api'; // Adjust path as needed



export const getClubProfile = async () => {
  try {
    const response = await api.get(`/club-profile/`);
    const data = response.data;
    return {
      success: true,
      profile: data, // ClubProfileResponse: { user: UserRead, club: ClubRead | null }
    };
  } catch (error) {
    console.error("Get club profile error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Network error.",
    };
  }
};

export const createClub = async (payload) => {
  try {
    const response = await api.post(`/club-profile/club`, payload);
    const data = response.data;
    return {
      success: true,
      message: "Club created successfully",
      club: data, // ClubRead
    };
  } catch (error) {
    console.error("Create club error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Network error.",
    };
  }
};

export const updateClub = async (clubId, payload) => {
  try {
    const response = await api.put(`/club-profile/club/${clubId}`, payload);
    const data = response.data;
    return {
      success: true,
      message: "Club updated successfully",
      club: data, // ClubRead
    };
  } catch (error) {
    console.error("Update club error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Network error.",
    };
  }
};