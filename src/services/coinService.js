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

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const coinService = {
  // Get coin balance and recent transactions
  async getBalance() {
    try {
      const response = await api.get('/user/coins/balance');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get transaction history with pagination
  async getTransactionHistory(page = 1, perPage = 20) {
    try {
      const response = await api.get(`/user/coins/history?page=${page}&per_page=${perPage}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get purchase options
  async getPurchaseOptions() {
    try {
      const response = await api.get('/user/coins/purchase-options');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Purchase coins
  async purchaseCoins(amountUsd) {
    try {
      const response = await api.post('/user/coins/purchase', {
        amount_usd: amountUsd
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Spend coins
  async spendCoins(amount, action, notes = null) {
    try {
      const response = await api.post('/user/coins/spend', {
        amount,
        action,
        notes
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Check available rewards
  async checkAvailableRewards() {
    try {
      const response = await api.get('/user/coins/rewards/available');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Claim daily login reward
  async claimDailyLoginReward() {
    try {
      const response = await api.post('/user/coins/rewards/daily-login');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Claim registration reward
  async claimRegistrationReward() {
    try {
      const response = await api.post('/user/coins/rewards/registration');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Claim activity reward
  async claimActivityReward() {
    try {
      const response = await api.post('/user/coins/rewards/activity');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Record user activity
  async recordActivity(minutes = 1) {
    try {
      const response = await api.post('/user/coins/activity/record', {
        minutes
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default coinService; 