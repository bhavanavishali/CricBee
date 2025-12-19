import api from '@/api';

export const getUsers = async (skip = 0, limit = 50, role = null, status = null, search = null) => {
  try {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (role && role !== 'all') params.append('role', role);
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);
    
    const response = await api.get(`/admin/users?${params.toString()}`);
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
    // Fetch all pages to find the user (or we could create a separate endpoint)
    // For now, we'll search through paginated results
    let skip = 0;
    const limit = 100;
    let found = false;
    let user = null;
    
    while (!found) {
      const response = await api.get(`/admin/users?skip=${skip}&limit=${limit}`);
      const users = response.data.users || [];
      user = users.find(u => u.id === userId);
      
      if (user) {
        found = true;
        break;
      }
      
      if (users.length < limit) {
        // Reached the end
        break;
      }
      
      skip += limit;
    }
    
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



export const getTournaments = async (skip = 0, limit = 50) => {
  try {
    const response = await api.get(`/admin/tournaments?skip=${skip}&limit=${limit}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || 'Failed to fetch tournaments',
    };
  }
};

export const getTournamentDetails = async (tournamentId) => {
  try {
    const response = await api.get(`/admin/tournaments/${tournamentId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || 'Failed to fetch tournament details',
    };
  }
};

export const updateTournamentBlockStatus = async (tournamentId, isBlocked) => {
  try {
    const response = await api.patch(`/admin/tournaments/${tournamentId}/block`, {
      is_blocked: isBlocked,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail || 'Failed to update tournament status',
    };
  }
};