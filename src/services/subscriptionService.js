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
  }
  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const subscriptionService = {
  // Get subscription balance and info
  getBalance: async () => {
    try {
      const response = await api.get('/user/subscription/balance');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch subscription data');
    }
  },

  // Get subscription pricing
  getPricing: async () => {
    try {
      const response = await api.get('/user/subscription/pricing');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch pricing');
    }
  },

  // Upgrade subscription
  upgrade: async (level) => {
    try {
      const response = await api.post('/user/subscription/upgrade', { level });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upgrade subscription');
    }
  },

  // Get subscription transactions
  getTransactions: async () => {
    try {
      const response = await api.get('/user/subscription/transactions');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch subscription history');
    }
  },

  // Payment methods
  payment: {
    // Create payment
    create: async (paymentData) => {
      try {
        const response = await api.post('/user/payment/create', paymentData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create payment');
      }
    },

    // Cancel payment
    cancel: async (paymentId) => {
      try {
        const response = await api.post('/user/payment/cancel', { payment_id: paymentId });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to cancel payment');
      }
    },

    // Get payment history
    getHistory: async () => {
      try {
        const response = await api.get('/user/payment/history');
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch payment history');
      }
    },

    // Get QR code
    getQrCode: async () => {
      try {const response = await api.get('/user/payment/qr-code');return response.data;
      } catch (error) {
        console.error('QR code API error:', error.response || error);
        throw new Error(error.response?.data?.message || 'Failed to fetch QR code');
      }
    }
  }
};

export default subscriptionService; 