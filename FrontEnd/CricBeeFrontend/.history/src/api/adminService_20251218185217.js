import api from '@/api';

export const getUsers = async () => {
  try {
    const response = await api.get('/admin/users');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || 'Failed to fetch users',
    };
  }
};

export const updateUserStatus = async (userId, isActive) => {
  try {
    const response = await api.patch(`/admin/users/${userId}/status`, {
      is_active: isActive,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || 'Failed to update user status',
    };
  }
};

export const getUserDetails = async (userId) => {
  try {
    
    const response = await api.get('/admin/users');
    const user = response.data.find(u => u.id === userId);
    if (user) {
      return { success: true, data: user };
    }
    return { success: false, message: 'User not found' };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || 'Failed to fetch user details',
    };
  }
};

// Pricing Plan API functions
export const getPricingPlans = async () => {
  try {
    const response = await api.get('/admin/pricing-plans');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || 'Failed to fetch pricing plans',
    };
  }
};

export const getPricingPlan = async (planId) => {
  try {
    const response = await api.get(`/admin/pricing-plans/${planId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || 'Failed to fetch pricing plan',
    };
  }
};

export const createPricingPlan = async (planData) => {
  try {
    const response = await api.post('/admin/pricing-plans', planData);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || 'Failed to create pricing plan',
    };
  }
};

export const updatePricingPlan = async (planId, planData) => {
  try {
    const response = await api.put(`/admin/pricing-plans/${planId}`, planData);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || 'Failed to update pricing plan',
    };
  }
};

export const updatePricingPlanStatus = async (planId, status) => {
  try {
    const response = await api.patch(`/admin/pricing-plans/${planId}/status`, {
      status: status,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || 'Failed to update pricing plan status',
    };
  }
};
export const getTransactions = async (skip = 0, limit = 100) => {
  const response = await api.get(`/admin/transactions?skip=${skip}&limit=${limit}`);
  return response.data;
};

export const getWalletBalance = async () => {
  try {
    const response = await api.get('/admin/wallet');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || 'Failed to fetch wallet balance',
    };
  }
};


export const getTournaments=