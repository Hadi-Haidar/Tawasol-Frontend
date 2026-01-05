import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 second timeout for most requests
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {// Don't redirect if this is a logout request
      const isLogoutRequest = error.config?.url?.includes('/logout');
      
      // Prevent infinite loops by checking if we're already on login page
      const isOnLoginPage = window.location.pathname === '/login' || 
                           window.location.pathname === '/auth/google/callback';
      
      if (!isOnLoginPage && !isLogoutRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on login page and not a logout request
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const authService = {
  // Email/Password Login
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      if (response.data.status === 'success') {
        return {
          user: response.data.user,
          token: response.data.token,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0][0];
        throw new Error(firstError);
      }
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Email/Password Signup
  signup: async (userData) => {
    try {
      const signupData = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        password_confirmation: userData.password // Laravel expects this field name
      };
      
      // Use a longer timeout specifically for signup since it sends emails
      const response = await api.post('/register', signupData, {
        timeout: 30000 // 30 seconds timeout for signup
      });
      
      if (response.data.status === 'success' || response.data.status === 'redirect_to_verification') {
        return {
          status: response.data.status,
          message: response.data.message,
          user_id: response.data.user_id,
          email: response.data.email
        };
      } else {
        throw new Error(response.data.message || 'Signup failed');
      }
    } catch (error) {
      // Handle timeout specifically
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Request timed out. The signup may have succeeded - please check your email for the verification code.');
      }
      
      // Handle network errors
      if (error.code === 'ERR_NETWORK' || !error.response) {
        throw new Error('Network error. Please check your connection. If you received an email, you can still verify your account.');
      }
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0][0];
        throw new Error(firstError);
      }
      throw new Error(error.response?.data?.message || 'Signup failed');
    }
  },

  // Email verification with code
  verifyEmail: async (email, code) => {
    try {
      const response = await api.post('/verify-email', { email, code });
      return response.data;
    } catch (error) {
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0][0];
        throw new Error(firstError);
      }
      throw new Error(error.response?.data?.message || 'Email verification failed');
    }
  },

  // Resend verification code
  resendVerificationCode: async (email) => {
    try {
      const response = await api.post('/resend-verification-code', { email });
      return response.data;
    } catch (error) {
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0][0];
        throw new Error(firstError);
      }
      throw new Error(error.response?.data?.message || 'Failed to resend verification code');
    }
  },

  // Google Authentication - Redirect to backend
  googleAuth: () => {
    // Redirect to Laravel backend Google OAuth
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  // Handle Google callback (for when user returns from Google)
  handleGoogleCallback: async () => {
    try {
      const response = await api.get('/auth/google/callback');
      if (response.data.success) {
        return {
          user: response.data.user,
          token: response.data.token,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Google authentication failed');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Google authentication failed');
    }
  },

  // Refresh user profile data
  refreshProfile: async () => {
    try {
  
      const response = await api.get('/profile');
      if (response.data.success) {

        return response.data.user;
      } else {
        throw new Error(response.data.message || 'Failed to refresh profile');
      }
    } catch (error) {
      console.error('Profile refresh failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to refresh profile');
    }
  },

  // Forgot Password
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/forgot-password', { email });
      return response.data;
    } catch (error) {
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0][0];
        throw new Error(firstError);
      }
      throw new Error(error.response?.data?.message || 'Password reset request failed');
    }
  },

  // Reset Password
  resetPassword: async (token, email, password, passwordConfirmation) => {
    try {
      const response = await api.post('/reset-password', { 
        token,
        email,
        password,
        password_confirmation: passwordConfirmation 
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0][0];
        throw new Error(firstError);
      }
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  },

  // Get Current User
  getCurrentUser: async () => {
    try {
  
      const response = await api.get('/user');

      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw new Error(error.response?.data?.message || 'Failed to get user data');
    }
  },

  // Test token validity
  testToken: async () => {
    try {
      const response = await api.get('/test');
      return response.data.success;
    } catch (error) {return false;
    }
  },

  // Logout
  logout: async () => {
    try {
      // Get the token before making the request
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/logout');
    
      }
    } catch (error) {
      // Don't treat 401 as an error during logout
      if (error.response?.status === 401) {
    
      } else {
        console.error('Logout error:', error);
      }
      // Even if the API call fails, we still want to clear local data
    }
  },
};

export default authService; 