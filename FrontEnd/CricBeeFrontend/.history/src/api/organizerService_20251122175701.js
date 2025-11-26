



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




export const createOrganization = async (data, imageFile = null) => {
  try {
    const formData = new FormData();
    formData.append('organization_name', data.organization_name);
    formData.append('location', data.location);
    formData.append('bio', data.bio);
    
    if (imageFile) {
      formData.append('file', imageFile);
    }
    
    const response = await api.post(`/profile/organization`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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

// Add this new function for updating both user and organization
export const updateProfile = async (payload) => {
  try {
    const response = await api.put(`/profile/`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.detail || 'Error updating profile' 
    };
  }
};

// Add this new function for uploading organization image
export const uploadOrganizationImage = async (orgId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/profile/organization/${orgId}/image`, formData, {
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