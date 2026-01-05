import apiService from './apiService';

class NotificationService {
    constructor() {
        this.baseURL = '/notifications';
    }

    /**
     * Get user's notifications with pagination and filters
     */
    async getNotifications(params = {}) {
        try {
            const response = await apiService.get(this.baseURL, { params });
            return response;
        } catch (error) {
            console.error('❌ Error fetching notifications:', error);
            throw error;
        }
    }

    /**
     * Get unread notifications count
     */
    async getUnreadCount() {
        try {
            const response = await apiService.get(`${this.baseURL}/unread-count`);return response;
        } catch (error) {
            console.error('❌ Error fetching unread count:', error);
            console.error('Error details:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get recent unread notifications for navbar dropdown
     */
    async getRecentNotifications(limit = 5) {
        try {
            const response = await apiService.get(`${this.baseURL}/recent`, { params: { limit } });
            return response;
        } catch (error) {
            console.error('❌ Error fetching recent notifications:', error);
            throw error;
        }
    }

    /**
     * Mark a specific notification as read
     */
    async markAsRead(notificationId) {
        try {
            const response = await apiService.post(`${this.baseURL}/${notificationId}/mark-read`);
            return response.data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            const response = await apiService.post(`${this.baseURL}/mark-all-read`);
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    /**
     * Mark notifications of a specific type as read
     */
    async markTypeAsRead(type) {
        try {
            const response = await apiService.post(`${this.baseURL}/mark-type-read`, { type });
            return response.data;
        } catch (error) {
            console.error('Error marking type notifications as read:', error);
            throw error;
        }
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId) {
        try {
            const response = await apiService.delete(`${this.baseURL}/${notificationId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    /**
     * Get notification statistics
     */
    async getStats() {
        try {
            const response = await apiService.get(`${this.baseURL}/stats`);
            return response.data;
        } catch (error) {
            console.error('Error fetching notification stats:', error);
            throw error;
        }
    }

    /**
     * Get notification types for filtering
     */
    async getTypes() {
        try {
            const response = await apiService.get(`${this.baseURL}/types`);
            return response.data;
        } catch (error) {
            console.error('Error fetching notification types:', error);
            throw error;
        }
    }

    /**
     * Subscribe to user's private notification channel
     */
    subscribeToNotifications(userId, websocketService, callbacks = {}) {
        if (!websocketService) {
            console.error('WebSocket service not available');
            return null;
        }

        return websocketService.subscribeToUserChannel(userId, {
            onNotificationReceived: (data) => {if (callbacks.onNotificationReceived) {
                    callbacks.onNotificationReceived(data.notification);
                }
            },
            onNotificationRead: (data) => {if (callbacks.onNotificationRead) {
                    callbacks.onNotificationRead(data);
                }
            },
            onNotificationDeleted: (data) => {if (callbacks.onNotificationDeleted) {
                    callbacks.onNotificationDeleted(data);
                }
            },
            onSubscribed: () => {if (callbacks.onSubscribed) {
                    callbacks.onSubscribed();
                }
            },
            onError: (error) => {
                console.error('❌ Notification subscription error:', error);
                if (callbacks.onError) {
                    callbacks.onError(error);
                }
            }
        });
    }

    /**
     * Unsubscribe from notifications channel
     */
    unsubscribeFromNotifications(userId, websocketService) {
        if (!websocketService) {
            return;
        }

        websocketService.unsubscribeFromUserChannel(userId);
    }

    /**
     * Get notification icon based on type
     */
    getNotificationIcon(type) {
        const iconMap = {
            'post_like': 'heart',
            'post_comment': 'message-circle',
            'room_join_request': 'user-plus',
            'order_placed': 'shopping-cart',
            'payment_status': 'credit-card'
        };
        return iconMap[type] || 'bell';
    }

    /**
     * Get notification color based on type
     */
    getNotificationColor(type) {
        const colorMap = {
            'post_like': 'text-red-500',
            'post_comment': 'text-blue-500',
            'room_join_request': 'text-green-500',
            'order_placed': 'text-purple-500',
            'payment_status': 'text-yellow-500'
        };
        return colorMap[type] || 'text-gray-500';
    }

    /**
     * Format notification for display
     */
    formatNotification(notification) {
        return {
            ...notification,
            icon: this.getNotificationIcon(notification.type),
            color: this.getNotificationColor(notification.type),
            timeAgo: this.formatTimeAgo(notification.created_at)
        };
    }

    /**
     * Format time ago helper
     */
    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService; 