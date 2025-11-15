// services/organizationServices.js
import api from '@/api';


export const getProfile = async () => {
  try {
    const response = await api.get(`/profile/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.detail || 'Error fetching profile' 
    };
  }
};

export const createOrganization = async (data) => {
  try {
    const response = await api.post(`/profile/organization`, data);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.detail || 'Error creating organization' 
    };
  }
};

export const updateOrganization = async (orgId, data) => {
  try {
    const response = await api.put(`/profile/organization/${orgId}`, data);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.detail || 'Error updating organization' 
    };
  }
};