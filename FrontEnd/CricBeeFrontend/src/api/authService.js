


// @/api/authService.js or wherever your API calls are located

import api from '@/api';

const API_BASE_URL = "http://localhost:8000";

// No localStorage usage - rely on Redux for state

export const signIn = async (credentials) => {
  try {
    const response = await api.post(`${API_BASE_URL}/auth/signin`, credentials);
    const data = response.data;

    // Axios automatically throws for non-2xx responses, so if we reach here, it's successful
    return {
      success: true,
      message: "Sign in successful",
      user: data,  // Backend returns UserRead (id, full_name, email, phone, role)
      // No token: Set via httpOnly cookie by backend
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
    const response = await api.post(`${API_BASE_URL}/auth/signup`, userData);
    const data = response.data;

    // Axios automatically throws for non-2xx responses, so if we reach here, it's successful
    return {
      success: true,
      message: "Sign up successful. Please check your email for OTP.",
      user: data,  // UserRead from backend
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Network error.",
    };
  }
};

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
  try {
    await api.post(`${API_BASE_URL}/auth/logout`);  // Optional: Add /auth/logout in backend to delete cookies
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    dispatch(clearUser());  // Clear from Redux
    window.location.href = "/";  // Redirect to home
  }
};

// Removed getCurrentUser and isAuthenticated - use Redux selectors instead