import api from './api';

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