

const API_BASE_URL = "http://127.0.0.1:8000"


export const signIn = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Sign in failed",
      }
    }

    return {
      success: true,
      message: data.message || "Sign in successful",
      token: data.token,
      user: data.user,
    }
  } catch (error) {
    console.error("Sign in network error:", error)
    throw new Error(error?.message || "Network error. Please check your connection.")
  }
}


export const signUp = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle FastAPI validation/HTTP errors
      const message = data.detail || (Array.isArray(data.detail) ? data.detail[0].msg : data.message) || "Sign up failed"
      return {
        success: false,
        message: message,
      }
    }

    return {
      success: true,
      message: "Sign up successful",
      token: null,  // Explicitly null—no token returned
      user: data,  // Backend returns UserRead directly (id, full_name, email, phone, role)
    }
  } catch (error) {
    console.error("Sign up network error:", error)
    throw new Error(error?.message || "Network error. Please check your connection.")
  }
}

/**
 * Sign Out - Clears local storage
 */
export const signOut = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.href = "/"
}

/**
 * Get current user from local storage
 * @returns {Object|null} User object or null
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user")
    return userStr ? JSON.parse(userStr) : null
  } catch (error) {
    console.error("Error parsing user:", error)
    return null
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has a token
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem("token")
}

/**
 * Get auth token from local storage
 * @returns {string|null} Auth token or null
 */
export const getAuthToken = () => {
  return localStorage.getItem("token")
}