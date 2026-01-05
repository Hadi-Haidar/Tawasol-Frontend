import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import notificationService from '../services/notificationService';
import websocketService from '../services/websocket';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notificationChannel, setNotificationChannel] = useState(null);

    // Page-specific notification filtering
    const getPageContext = () => {
        const path = location.pathname;if (path.includes('/subscription') || path.includes('/payment') || path.includes('/coins')) {return 'payment';
        } else if (path.includes('/posts') || (path.includes('/rooms/') && !path.includes('/manage') && !path.includes('/edit'))) {return 'social';
        } else if (path.includes('/rooms') && (path.includes('/manage') || path.includes('/edit'))) {return 'room_management';
        } else if (path.includes('/store') || path.includes('/cart') || path.includes('/orders')) {return 'store';
        } else if (path.includes('/notifications')) {
            return 'all'; // Show all notifications on the notifications page
        } else if (path.includes('/dashboard')) {
            return 'dashboard';
        } else if (path === '/user/rooms' || path === '/user/rooms/') {
            return 'social';
        }
        return 'general';
    };

    const getRelevantNotificationTypes = (pageContext) => {
        const typeMapping = {
            'payment': ['payment_status'],
            'social': ['post_like', 'post_comment'],
            'room_management': ['room_join_request'],
            'store': ['order_placed'],
            'dashboard': ['post_like', 'post_comment', 'room_join_request', 'order_placed', 'payment_status'], // Recent activity
            'all': ['post_like', 'post_comment', 'room_join_request', 'order_placed', 'payment_status'],
            'general': []
        };
        
        return typeMapping[pageContext] || [];
    };

    const filterNotificationsByPage = (notifications, pageContext) => {
        const relevantTypes = getRelevantNotificationTypes(pageContext);
        console.log('Filtering notifications:', {
            pageContext,
            relevantTypes,
            totalNotifications: notifications.length
        });
        
        if (relevantTypes.length === 0) {
            return [];
        }
        
        const filtered = notifications.filter(notification => 
            relevantTypes.includes(notification.type)
        );
        
        console.log('Filtered notifications result:', {
            filtered: filtered.length,
            total: notifications.length
        });
        
        return filtered;
    };

    // Initialize notification subscription when user is authenticated
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            initializeNotifications();
            subscribeToRealTimeNotifications();

            return () => {
                unsubscribeFromNotifications();
            };
        }
    }, [isAuthenticated, user?.id]);

    const initializeNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch initial unread count
            const countResponse = await notificationService.getUnreadCount();
            const unreadCountValue = countResponse?.unread_count ?? 0;
            setUnreadCount(unreadCountValue);

            // Fetch recent notifications for dropdown
            const recentResponse = await notificationService.getRecentNotifications(10);
            const recentNotifications = recentResponse?.notifications ?? [];
            console.log('Recent notifications loaded:', recentNotifications.length);
            setNotifications(recentNotifications.map(notification => 
                notificationService.formatNotification(notification)
            ));

        } catch (error) {
            console.error('❌ Failed to initialize notifications:', error);
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const subscribeToRealTimeNotifications = () => {
        if (!user?.id) return;

        // Get auth token from localStorage (adjust based on your auth implementation)
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No auth token available for websocket connection');
            setError('Authentication required for real-time notifications');
            return;
        }

        // Initialize websocket connection if not already connected
        if (!websocketService.isConnectedToSocket()) {
            websocketService.initialize(token);
        }

        // Wait a moment for connection to establish, then subscribe
        setTimeout(() => {
            const channel = notificationService.subscribeToNotifications(
                user.id,
                websocketService,
                {
                    onNotificationReceived: handleNewNotification,
                    onNotificationRead: handleNotificationRead,
                    onNotificationDeleted: handleNotificationDeleted,
                    onSubscribed: () => {
                        console.log('Subscribed to notifications');
                    },
                    onError: (error) => {
                        console.error('❌ Notification subscription error:', error);
                        setError('Real-time notifications unavailable');
                    }
                }
            );

            setNotificationChannel(channel);
        }, 1000); // Give websocket 1 second to connect
    };

    const unsubscribeFromNotifications = () => {
        if (user?.id) {
            notificationService.unsubscribeFromNotifications(user.id, websocketService);
            setNotificationChannel(null);
        }
    };

    const handleNewNotification = useCallback((notification) => {
        // Format the notification
        const formattedNotification = notificationService.formatNotification(notification);
        
        // Add to the beginning of the notifications list
        setNotifications(prev => [formattedNotification, ...prev.slice(0, 9)]); // Keep only 10 most recent
        
        // Increment unread count
        setUnreadCount(prev => prev + 1);

        // Browser notifications completely disabled
        // showBrowserNotification(formattedNotification);
    }, []);

    const handleNotificationRead = useCallback((data) => {
        const { notificationId, unreadCount: newUnreadCount } = data;
        
        // Update the notification as read in local state
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === notificationId
                    ? { ...notification, is_read: true, read_at: new Date().toISOString() }
                    : notification
            )
        );
        
        // Update unread count
        setUnreadCount(newUnreadCount);
    }, []);

    const handleNotificationDeleted = useCallback((data) => {
        const { notificationId, unreadCount: newUnreadCount } = data;
        
        // Remove the notification from local state
        setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
        
        // Update unread count
        setUnreadCount(newUnreadCount);
    }, []);

    const showBrowserNotification = (notification) => {
        // Browser notifications disabled - only show in-app notifications
        console.log('Would show browser notification:', notification.title);
    };

    const requestBrowserNotificationPermission = async () => {
        // Browser notifications disabled - no permission needed
        return false;
    };

    const fetchNotifications = async (params = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await notificationService.getNotifications(params);
            
            // Handle case where response might be null/undefined
            if (!response) {
                return { notifications: { data: [] }, unread_count: 0 };
            }
            
            // Handle case where notifications might be missing
            const notificationsData = response.notifications?.data ?? [];
            const formattedNotifications = notificationsData.map(notification =>
                notificationService.formatNotification(notification)
            );
            
            return {
                ...response,
                notifications: {
                    ...response.notifications,
                    data: formattedNotifications
                }
            };
        } catch (error) {
            console.error('❌ Failed to fetch notifications:', error);
            console.error('Error details:', error.response?.data || error.message);
            setError('Failed to load notifications');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const response = await notificationService.markAsRead(notificationId);
            
            // Update local state
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, is_read: true, read_at: new Date().toISOString() }
                        : notification
                )
            );
            
            setUnreadCount(response.unread_count);
            return response;
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            throw error;
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await notificationService.markAllAsRead();
            
            // Update local state
            setNotifications(prev =>
                prev.map(notification => ({
                    ...notification,
                    is_read: true,
                    read_at: new Date().toISOString()
                }))
            );
            
            setUnreadCount(0);
            return response;
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            throw error;
        }
    };

    const markTypeAsRead = async (type) => {
        try {
            const response = await notificationService.markTypeAsRead(type);
            
            // Update local state
            setNotifications(prev =>
                prev.map(notification =>
                    notification.type === type
                        ? { ...notification, is_read: true, read_at: new Date().toISOString() }
                        : notification
                )
            );
            
            setUnreadCount(response.unread_count);
            return response;
        } catch (error) {
            console.error('Failed to mark type notifications as read:', error);
            throw error;
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const response = await notificationService.deleteNotification(notificationId);
            
            // Update local state
            setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
            setUnreadCount((prev) => (response && typeof response.unread_count === 'number') ? response.unread_count : prev);
            
            return response;
        } catch (error) {
            console.error('Failed to delete notification:', error);
            throw error;
        }
    };

    const refreshNotifications = async () => {
        if (isAuthenticated && user?.id) {
            await initializeNotifications();
        }
    };

    const value = {
        notifications,
        unreadCount,
        loading,
        error,
        notificationChannel,
        
        // Page-aware functions
        getPageContext,
        getRelevantNotificationTypes,
        filterNotificationsByPage,
        getPageNotifications: () => filterNotificationsByPage(notifications, getPageContext()),
        
        // Actions
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        markTypeAsRead,
        deleteNotification,
        refreshNotifications,
        requestBrowserNotificationPermission,
        
        // Utility functions
        formatNotification: notificationService.formatNotification,
        getNotificationIcon: notificationService.getNotificationIcon,
        getNotificationColor: notificationService.getNotificationColor,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}; 