import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, Heart, MessageCircle, UserPlus, ShoppingCart, CreditCard, X } from 'lucide-react';

const PageNotifications = ({ 
    showTitle = true, 
    maxNotifications = 3,
    className = "",
    showEmpty = false 
}) => {
    const { 
        notifications,
        getPageNotifications, 
        getPageContext, 
        markAsRead, 
        deleteNotification,
        loading 
    } = useNotifications();

    const pageContext = getPageContext();
    const pageNotifications = getPageNotifications();
    const limitedNotifications = pageNotifications.slice(0, maxNotifications);

    // Debug logging
    });

    const getIcon = (type) => {
        const iconMap = {
            'post_like': Heart,
            'post_comment': MessageCircle,
            'room_join_request': UserPlus,
            'order_placed': ShoppingCart,
            'payment_status': CreditCard
        };
        const IconComponent = iconMap[type] || Bell;
        return <IconComponent size={16} />;
    };

    const getContextTitle = (context) => {
        const titles = {
            'payment': 'Payment Updates',
            'social': 'Recent Activity',
            'room_management': 'Room Management',
            'store': 'Store Activity',
            'dashboard': 'Recent Activity',
            'all': 'All Notifications',
            'general': 'Notifications'
        };
        return titles[context] || 'Notifications';
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markAsRead(notificationId);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await deleteNotification(notificationId);
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    // Don't show if no relevant notifications and showEmpty is false
    if (!showEmpty && limitedNotifications.length === 0 && !loading) {
        return null;
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
            {showTitle && (
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                        <Bell size={16} className="mr-2" />
                        {getContextTitle(pageContext)}
                        {limitedNotifications.length > 0 && (
                            <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                                {limitedNotifications.length}
                            </span>
                        )}
                        <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full">
                            Context: {pageContext}
                        </span>
                    </h3>
                </div>
            )}

            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</span>
                    </div>
                ) : limitedNotifications.length === 0 ? (
                    <div className="text-center py-4">
                        <Bell size={24} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No relevant notifications for this page
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {limitedNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                                    notification.is_read
                                        ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                }`}
                            >
                                <div className={`flex-shrink-0 ${notification.color}`}>
                                    {getIcon(notification.type)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {notification.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {notification.timeAgo}
                                    </p>
                                </div>

                                <div className="flex-shrink-0 flex space-x-1">
                                    {!notification.is_read && (
                                        <button
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            title="Mark as read"
                                        >
                                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={() => handleDelete(notification.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                        title="Delete notification"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        {pageNotifications.length > maxNotifications && (
                            <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-700">
                                <a
                                    href="/user/notifications"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                >
                                    View all {pageNotifications.length} notifications →
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageNotifications;
