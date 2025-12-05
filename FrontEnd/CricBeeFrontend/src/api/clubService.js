// src/services/clubServices.js
import api from '@/api';

export const getClubProfile = async () => {
  try {
    const response = await api.get(`/club-profile/`);
    const data = response.data;
    return {
      success: true,
      profile: data,
    };
  } catch (error) {
    console.error("Get club profile error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Network error.",
    };
  }
};

export const createClub = async (data, imageFile = null) => {
  try {
    const formData = new FormData();
    formData.append('club_name', data.club_name);
    formData.append('description', data.description);
    formData.append('short_name', data.short_name);
    formData.append('location', data.location);
    
    if (imageFile) {
      formData.append('file', imageFile);
    }
    
    const response = await api.post(`/club-profile/club`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      success: true,
      message: "Club created successfully",
      club: response.data,
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
    const response = await api.patch(`/club-profile/club/${clubId}`, payload);
    return {
      success: true,
      message: "Club updated successfully",
      club: response.data,
    };
  } catch (error) {
    console.error("Update club error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Network error.",
    };
  }
};

export const updateProfile = async (payload) => {
  try {
    const response = await api.patch(`/club-profile/`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.detail || 'Error updating profile' 
    };
  }
};

export const uploadClubImage = async (clubId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/club-profile/club/${clubId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.detail || 'Error uploading image' 
    };
  }
};


export const searchPlayerByCricbId = async (clubId, cricbId) => {
  try {
    const response = await api.get(`/club-profile/club/${clubId}/search-player/${cricbId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Search player error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Player not found",
    };
  }
};

export const addPlayerToClub = async (clubId, cricbId) => {
  try {
    const response = await api.post(`/club-profile/club/${clubId}/players`, { cricb_id: cricbId });
    return {
      success: true,
      message: "Player added successfully",
      data: response.data,
    };
  } catch (error) {
    console.error("Add player error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Failed to add player",
    };
  }
};

export const getClubPlayers = async (clubId) => {
  try {
    const response = await api.get(`/club-profile/club/${clubId}/players`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Get club players error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Failed to fetch players",
    };
  }
};

export const getEligibleTournaments = async () => {
  try {
    const response = await api.get('/clubmanager/tournaments');
    return response.data;
  } catch (error) {
    console.error("Get eligible tournaments error:", error);
    throw error;
  }
};