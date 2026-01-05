import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;

  } else {

  }

  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isOnAuthPage = window.location.pathname === '/login' || 
                          window.location.pathname === '/auth/google/callback' ||
                          window.location.pathname.startsWith('/auth');
      
      if (!isOnAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on auth page
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const apiService = {
  // Generic GET request
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generic POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generic PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generic PATCH request
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await api.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generic DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Post-specific methods
  posts: {
    // Like a post
    like: async (roomId, postId) => {
      try {
        const response = await api.post(`/rooms/${roomId}/posts/${postId}/like`);
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    // Unlike a post
    unlike: async (roomId, postId) => {
      try {
        const response = await api.delete(`/rooms/${roomId}/posts/${postId}/like`);
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    // Get post likes info
    getLikes: async (roomId, postId) => {
      try {
        const response = await api.get(`/rooms/${roomId}/posts/${postId}/likes`);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
  },

  // Get axios instance for direct use if needed
  getAxiosInstance: () => api,

  // Support System for Users
  getUserSupportTickets: async (params = {}) => {
    try {
      const response = await api.get('/support', { params });
      return response.data;
    } catch (error) {
      console.error('Get user support tickets error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch support tickets');
    }
  },

  getUserSupportStats: async () => {
    try {
      const response = await api.get('/support/stats');
      return response.data;
    } catch (error) {
      console.error('Get user support stats error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch support statistics');
    }
  },

  createSupportTicket: async (ticketData) => {
    try {
      const response = await api.post('/support', ticketData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Create support ticket error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create support ticket');
    }
  },

  getUserSupportTicket: async (id) => {
    try {
      const response = await api.get(`/support/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get user support ticket error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch support ticket');
    }
  },

  sendUserSupportMessage: async (id, messageData) => {
    try {
      const config = {};
      if (messageData instanceof FormData) {
        config.headers = {
          'Content-Type': 'multipart/form-data'
        };
      }
      
      const response = await api.post(`/support/${id}/messages`, messageData, config);
      return response.data;
    } catch (error) {
      console.error('Send user support message error:', error);
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
  },
};

export default apiService; 