import { api } from './api';

// Admin Notification Service
export const adminNotificationService = {
  // Get all admin notifications with filters
  async getNotifications(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/admin/notifications?${queryString}` : '/admin/notifications';
      const response = await api.get(endpoint);
      if (response && response.notifications) {
        return response;
      }
      throw new Error('No response from server');
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      throw error; // Don't use fallback, let component handle the error
    }
  },

  // Create and send notification
  async createNotification(notificationData) {
    try {
      const response = await api.post('/admin/notifications', notificationData);
      return response || { success: false, message: 'No response from server' };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to create notification' 
      };
    }
  },

  // Get notification details
  async getNotification(id) {
    try {
      const response = await api.get(`/admin/notifications/${id}`);
      return response; // Return response directly, not response.data
    } catch (error) {
      console.error('Error fetching notification details:', error);
      throw error;
    }
  },

  // Delete notification
  async deleteNotification(id) {
    try {
      const response = await api.delete(`/admin/notifications/${id}`);
      return response; // Return response directly, not response.data
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Get notification types
  async getNotificationTypes() {
    try {
      const response = await api.get('/admin/notifications/types');
      if (response && response.types) {
        return response;
      }
      throw new Error('No response from server');
    } catch (error) {
      console.error('Error fetching notification types:', error);
      throw error; // Don't use fallback, let component handle the error
    }
  },

  // Get target audiences (real data only)
  async getTargetAudiences() {
    try {
      const response = await api.get('/admin/notifications/target-audiences');
      if (response && response.audiences) {
        return response;
      }
      throw new Error('No response from server');
    } catch (error) {
      console.error('Error fetching target audiences:', error);
      throw error; // Don't use fallback, let component handle the error
    }
  },

  // Get notification statistics
  async getNotificationStats() {
    try {
      const response = await api.get('/admin/notifications/stats');
      if (response && response.stats) {
        return response;
      }
      throw new Error('No response from server');
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error; // Don't use fallback, let component handle the error
    }
  },

};

export default adminNotificationService; 