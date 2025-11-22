


// @/api/authService.js or wherever your API calls are located

import api from '@/api';
const API_BASE_URL = "http://localhost:8000";

export const signIn = async (credentials) => {
  try {
    const response = await api.post(`${API_BASE_URL}/auth/signin`, credentials);
    const data = response.data;

    
    return {
      success: true,
      message: "Sign in successful",
      user: data,  
    
    };
  } catch (error) {
    console.error("Sign in error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Network error. Please check your connection.",
    };
  }
};

export const signUp = async (userData) => {
  try {
    const response = await api.post(`/auth/signup`, userData);
    const data = response.data;

    
    return {
      success: true,
      message: "Sign up successful. Please check your email for OTP.",
      user: data,  
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Network error.",
    };
  }
};

<<<<<<< HEAD
/**
 * Verify OTP - Verify the OTP sent to user's email
 * @param {string} email - User's email address
 * @param {string} otp - 6-digit OTP
 */
export const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post(`${API_BASE_URL}/auth/verify-otp`, {
      email,
      otp
    });
    const data = response.data;

    return {
      success: true,
      message: data.message || "Email verified successfully",
      data: data
    };
  } catch (error) {
    console.error("OTP verification error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Invalid or expired OTP",
    };
  }
};

/**
 * Resend OTP - Request a new OTP to be sent to user's email
 * @param {string} email - User's email address
 */
export const resendOTP = async (email) => {
  try {
    const response = await api.post(`${API_BASE_URL}/auth/resend-otp`, {
      email
    });
    const data = response.data;

    return {
      success: true,
      message: data.message || "OTP sent successfully",
      data: data
    };
  } catch (error) {
    console.error("Resend OTP error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Failed to resend OTP",
    };
  }
};

/**
 * Sign Out - Call backend to invalidate cookies (optional), then clear Redux
 * @param {Function} dispatch - Redux dispatch function
 */
export const signOut = async (dispatch) => {
=======

export const verifyOTP = async (email, otp) => {
>>>>>>> feature/player
  try {
    const response = await api.post(`${API_BASE_URL}/auth/verify-otp`, {
      email,
      otp
    });
    const data = response.data;

    return {
      success: true,
      message: data.message || "Email verified successfully",
      data: data
    };
  } catch (error) {
    console.error("OTP verification error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Invalid or expired OTP",
    };
  }
};


export const resendOTP = async (email) => {
  try {
    const response = await api.post(`${API_BASE_URL}/auth/resend-otp`, {
      email
    });
    const data = response.data;

    return {
      success: true,
      message: data.message || "OTP sent successfully",
      data: data
    };
  } catch (error) {
    console.error("Resend OTP error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Failed to resend OTP",
    };
  }
};





export const signOut = async (dispatch) => {
  try {

    await api.post(`${API_BASE_URL}/auth/logout`);
  } catch (error) {
    console.error("Logout error:", error);
    
  } finally {
   
    dispatch(clearUser());
    
    return Promise.resolve();
  }
};
