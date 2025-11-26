




import api from '@/api';


export const signIn = async (credentials) => {
  try {
    const response = await api.post(`/auth/signin`, credentials);
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


export const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post(`$/auth/verify-otp`, {
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
