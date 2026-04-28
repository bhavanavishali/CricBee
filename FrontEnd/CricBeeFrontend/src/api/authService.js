




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

    const errorData = error.response?.data;
    let errorMessage = "Signup failed. Please try again.";

    if (Array.isArray(errorData) && errorData.length > 0) {
      const firstError = errorData[0];
      errorMessage = String(firstError?.msg || firstError?.message || errorMessage);
    } else if (errorData?.detail) {
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
        const firstError = errorData.detail[0];
        errorMessage = String(firstError?.msg || firstError?.message || errorMessage);
      } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
        errorMessage = String(
          errorData.detail.msg ||
          errorData.detail.message ||
          Object.values(errorData.detail)[0] ||
          errorMessage
        );
      }
    } else if (errorData?.message) {
      errorMessage = String(errorData.message);
    } else if (error.request) {
      errorMessage = "Network error. Please check your internet connection.";
    } else {
      errorMessage = error.message || "An unexpected error occurred.";
    }

    return {
      success: false,
      message: String(errorMessage),
    };
  }
};


export const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post(`/auth/verify-otp`, {
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
    const response = await api.post(`/auth/resend-otp`, {
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

    await api.post(`/auth/logout`);
  } catch (error) {
    console.error("Logout error:", error);
    
  } finally {
   
    dispatch(clearUser());
    
    return Promise.resolve();
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post(`/auth/forgot-password`, { email });
    const data = response.data;

    return {
      success: true,
      message: data.message || "Password reset link sent to your email",
      data: data
    };
  } catch (error) {
    console.error("Forgot password error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Failed to send reset link",
    };
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post(`/auth/reset-password`, {
      token,
      new_password: newPassword
    });
    const data = response.data;

    return {
      success: true,
      message: data.message || "Password reset successfully",
      data: data
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message || "Failed to reset password",
    };
  }
};