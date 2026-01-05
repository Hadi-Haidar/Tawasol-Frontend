import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Token added to request...');
  } else {
    console.log('No token available');
  }
  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Admin API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const adminService = {
  // Dashboard Analytics
  getDashboardAnalytics: async () => {
    try {
      const response = await api.get('/admin/dashboard/analytics');
      return response.data;
    } catch (error) {
      console.error('Analytics error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard analytics');
    }
  },
  
  getWeeklyVisitorsData: async () => {
    try {
      const response = await api.get('/admin/dashboard/weekly-visitors');
      return response.data;
    } catch (error) {
      console.error('Weekly visitors error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch weekly visitors data');
    }
  },
  
  getDailyRegistrationsData: async () => {
    try {
      const response = await api.get('/admin/dashboard/daily-registrations');
      return response.data;
    } catch (error) {
      console.error('Daily registrations error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch daily registrations data');
    }
  },
  
  getMostEngagingPosts: async () => {
    try {
      const response = await api.get('/admin/dashboard/engaging-posts');
      return response.data;
    } catch (error) {
      console.error('Engaging posts error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch most engaging posts');
    }
  },
  
  getSubscriptionDistribution: async () => {
    try {
      const response = await api.get('/admin/dashboard/subscription-distribution');
      return response.data;
    } catch (error) {
      console.error('Subscription distribution error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch subscription distribution');
    }
  },

  // User Management
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      console.error('Get users error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  getUser: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user details');
    }
  },

  updateUserSubscription: async (userId, subscriptionLevel) => {
    try {
      const response = await api.put(`/admin/users/${userId}/subscription`, {
        subscription_level: subscriptionLevel
      });
      return response.data;
    } catch (error) {
      console.error('Update subscription error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update user subscription');
    }
  },

  updateUserStatus: async (userId, status, reason = '') => {
    try {
      const response = await api.put(`/admin/users/${userId}/status`, {
        status,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Update status error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update user status');
    }
  },

  deleteUser: async (userId, reason = '') => {
    try {
      const response = await api.delete(`/admin/users/${userId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error) {
      console.error('Delete user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  },

  restoreUser: async (userId) => {
    try {
      const response = await api.post(`/admin/users/${userId}/restore`);
      return response.data;
    } catch (error) {
      console.error('Restore user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to restore user');
    }
  },

  getDeletedUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users/deleted/list', { params });
      return response.data;
    } catch (error) {
      console.error('Get deleted users error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch deleted users');
    }
  },

  bulkUserAction: async (action, userIds, reason = '') => {
    try {
      const response = await api.post('/admin/users/bulk-action', {
        action,
        user_ids: userIds,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Bulk action error:', error);
      throw new Error(error.response?.data?.message || 'Failed to perform bulk action');
    }
  },

  // Send notification to a specific user
  sendNotificationToUser: async (userId, notificationData) => {
    try {
      const response = await api.post('/admin/notifications/send-to-user', {
        user_id: userId,
        ...notificationData
      });
      return response.data;
    } catch (error) {
      console.error('Send notification to user error:', error);
      throw new Error(error.response?.data?.message || 'Failed to send notification to user');
    }
  },

  // Activity Logs Management
  getActivityLogs: async (params = {}) => {
    try {
      const response = await api.get('/admin/activity-logs', { params });
      return response.data;
    } catch (error) {
      console.error('Get activity logs error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch activity logs');
    }
  },

  getActivityLogStats: async () => {
    try {
      const response = await api.get('/admin/activity-logs/stats');
      return response.data;
    } catch (error) {
      console.error('Get activity log stats error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch activity log statistics');
    }
  },

  getActivityLogCategories: async () => {
    try {
      const response = await api.get('/admin/activity-logs/categories');
      return response.data;
    } catch (error) {
      console.error('Get activity log categories error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch activity log categories');
    }
  },

  getActivityLogSeverities: async () => {
    try {
      const response = await api.get('/admin/activity-logs/severities');
      return response.data;
    } catch (error) {
      console.error('Get activity log severities error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch activity log severities');
    }
  },

  getRecentActivity: async (limit = 10) => {
    try {
      const response = await api.get('/admin/activity-logs/recent', { 
        params: { limit } 
      });
      return response.data;
    } catch (error) {
      console.error('Get recent activity error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch recent activity');
    }
  },

  logActivity: async (activityData) => {
    try {
      const response = await api.post('/admin/activity-logs', activityData);
      return response.data;
    } catch (error) {
      console.error('Log activity error:', error);
      throw new Error(error.response?.data?.message || 'Failed to log activity');
    }
  },

  // Support System Management
  getSupportTickets: async (params = {}) => {
    try {
      const response = await api.get('/admin/support', { params });
      return response.data;
    } catch (error) {
      console.error('Get support tickets error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch support tickets');
    }
  },

  getSupportTicket: async (id) => {
    try {
      const response = await api.get(`/admin/support/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get support ticket error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch support ticket');
    }
  },

  getSupportStats: async () => {
    try {
      const response = await api.get('/admin/support/stats');
      return response.data;
    } catch (error) {
      console.error('Get support stats error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch support statistics');
    }
  },

  getSupportPriorities: async () => {
    try {
      const response = await api.get('/admin/support/priorities');
      return response.data;
    } catch (error) {
      console.error('Get support priorities error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch support priorities');
    }
  },

  updateTicketStatus: async (id, status) => {
    try {
      const response = await api.put(`/admin/support/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Update ticket status error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update ticket status');
    }
  },

  assignTicket: async (id, assignmentData) => {
    try {
      const response = await api.put(`/admin/support/${id}/assign`, assignmentData);
      return response.data;
    } catch (error) {
      console.error('Assign ticket error:', error);
      throw new Error(error.response?.data?.message || 'Failed to assign ticket');
    }
  },

  sendSupportReply: async (id, replyData) => {
    try {
      const response = await api.post(`/admin/support/${id}/reply`, replyData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Send support reply error:', error);
      throw new Error(error.response?.data?.message || 'Failed to send reply');
    }
  },

  deleteSupportTicket: async (id) => {
    try {
      const response = await api.delete(`/admin/support/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete support ticket error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete support ticket');
    }
  },

  // Room Management
  getRooms: async (params = {}) => {
    try {
      const response = await api.get('/admin/rooms', { params });
      return response.data;
    } catch (error) {
      console.error('Get rooms error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch rooms');
    }
  },

  getRoom: async (roomId) => {
    try {
      const response = await api.get(`/admin/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('Get room error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch room details');
    }
  },

  updateRoom: async (roomId, roomData) => {
    try {
      const response = await api.put(`/admin/rooms/${roomId}`, roomData);
      return response.data;
    } catch (error) {
      console.error('Update room error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update room');
    }
  },

  deleteRoom: async (roomId, reason = '') => {
    try {
      const response = await api.delete(`/admin/rooms/${roomId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error) {
      console.error('Delete room error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete room');
    }
  },

  getRoomStatistics: async () => {
    try {
      const response = await api.get('/admin/rooms/statistics/overview');
      return response.data;
    } catch (error) {
      console.error('Get room statistics error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch room statistics');
    }
  },

  bulkRoomAction: async (action, roomIds, reason = '', type = null) => {
    try {
      const payload = {
        action,
        room_ids: roomIds,
        reason
      };
      
      if (type) {
        payload.type = type;
      }

      const response = await api.post('/admin/rooms/bulk-action', payload);
      return response.data;
    } catch (error) {
      console.error('Bulk room action error:', error);
      throw new Error(error.response?.data?.message || 'Failed to perform bulk action');
    }
  },

  // Payment Management
  getPaymentStatistics: async () => {
    try {
      const response = await api.get('/admin/payments/statistics');
      return response.data;
    } catch (error) {
      console.error('Get payment statistics error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch payment statistics');
    }
  },

  getPayments: async (params = {}) => {
    try {
      const response = await api.get('/admin/payments', { params });
      return response.data;
    } catch (error) {
      console.error('Get payments error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch payments');
    }
  },

  getSubscriptions: async (params = {}) => {
    try {
      const response = await api.get('/admin/subscriptions', { params });
      return response.data;
    } catch (error) {
      console.error('Get subscriptions error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch subscriptions');
    }
  },

  getPendingPayments: async () => {
    try {
      const response = await api.get('/admin/payments/pending');
      return response.data;
    } catch (error) {
      console.error('Get pending payments error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch pending payments');
    }
  },

  approvePayment: async (paymentId) => {
    try {
      const response = await api.post('/admin/payments/approve', {
        payment_id: paymentId
      });
      return response.data;
    } catch (error) {
      console.error('Approve payment error:', error);
      throw new Error(error.response?.data?.message || 'Failed to approve payment');
    }
  },

  rejectPayment: async (paymentId, reason) => {
    try {
      const response = await api.post('/admin/payments/reject', {
        payment_id: paymentId,
        reject_reason: reason
      });
      return response.data;
    } catch (error) {
      console.error('Reject payment error:', error);
      throw new Error(error.response?.data?.message || 'Failed to reject payment');
    }
  },

  getQrCodes: async () => {
    try {
      const response = await api.get('/admin/payments/qr-codes');
      return response.data;
    } catch (error) {
      console.error('Get QR codes error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch QR codes');
    }
  },

  updateQrCode: async (qrCodeId, formData) => {
    try {
      // Add method spoofing for Laravel
      formData.append('_method', 'PUT');
      
      // Log FormData contents
      for (let [key, value] of formData.entries()) {
        console.log('FormData entry:', key, value);
      }
      
      const response = await api.post(`/admin/payments/qr-code/${qrCodeId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });return response.data;
    } catch (error) {
      console.error('Update QR code error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.message || 'Failed to update QR code');
    }
  },

  getActiveQrCode: async () => {
    try {
      const response = await api.get('/admin/payments/active-qr-code');
      return response.data;
    } catch (error) {
      console.error('Get active QR code error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch active QR code');
    }
  }
};

export default adminService; 