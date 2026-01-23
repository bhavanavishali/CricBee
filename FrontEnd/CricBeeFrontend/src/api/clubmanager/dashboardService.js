import api from '@/api';

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/club-profile/dashboard-stats');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Failed to fetch dashboard stats",
    };
  }
};
