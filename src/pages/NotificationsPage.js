import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  ShoppingCart, 
  CreditCard,
  Filter,
  Check,
  CheckCheck,
  Trash2,
  Loader
} from 'lucide-react';
import Avatar from '../components/common/Avatar';

const NotificationsPage = () => {
  const {
    notifications: contextNotifications,
    unreadCount,
    loading: contextLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    markTypeAsRead,
    deleteNotification
  } = useNotifications();

  const [notifications, setNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]); // For sidebar counts
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({}); // Track loading state for individual actions
  const [selectedType, setSelectedType] = useState('all');
  const [showRead, setShowRead] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const notificationTypes = [
    { value: 'all', label: 'All Notifications', icon: Bell },
    { value: 'post_like', label: 'Post Likes', icon: Heart },
    { value: 'post_comment', label: 'Comments', icon: MessageCircle },
    { value: 'room_join_request', label: 'Join Requests', icon: UserPlus },
    { value: 'order_placed', label: 'Orders', icon: ShoppingCart },
    { value: 'payment_status', label: 'Payments', icon: CreditCard },
    { value: 'system', label: 'System', icon: Bell }
  ];

  // Load all notifications for sidebar counts on component mount
  useEffect(() => {
    loadAllNotifications();
  }, []);

  // Load filtered notifications when filters change
  useEffect(() => {
    loadNotifications();
  }, [selectedType, showRead, currentPage]);

  // Sync with context notifications for real-time updates
  useEffect(() => {
    // Only update if we have context notifications and they're different
    if (contextNotifications.length > 0) {
      // For new notifications, add them to allNotifications
      setAllNotifications(prev => {
        const existingIds = prev.map(n => n.id);
        const newNotifications = contextNotifications.filter(n => !existingIds.includes(n.id));
        if (newNotifications.length > 0) {
          
          // Also update the filtered notifications if they match current filter
          setNotifications(prevFiltered => {
            const existingFilteredIds = prevFiltered.map(n => n.id);
            const newFilteredNotifications = newNotifications.filter(n => {
              // Check if notification matches current filter
              if (selectedType === 'all') {
                return !existingFilteredIds.includes(n.id);
              } else {
                return n.type === selectedType && !existingFilteredIds.includes(n.id);
              }
            });
            
            if (newFilteredNotifications.length > 0) {
              return [...newFilteredNotifications, ...prevFiltered];
            }
            return prevFiltered;
          });
          
          return [...newNotifications, ...prev];
        }
        return prev;
      });
    }
  }, [contextNotifications, selectedType]);

  // Real-time sync happens automatically through contextNotifications changes
  // The NotificationContext handles all WebSocket events and updates contextNotifications
  // which then triggers our sync effect above

  const loadAllNotifications = async () => {
    try {
      // Fetch all notifications for sidebar counts (without pagination)
      const response = await fetchNotifications({ per_page: 1000 });
      setAllNotifications(response.notifications.data);
    } catch (error) {
      console.error('Failed to load all notifications:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        per_page: 6
      };
      
      if (selectedType !== 'all') {
        params.type = selectedType;
      }

      const response = await fetchNotifications(params);
      
      let filteredNotifications = response.notifications?.data || [];
      
      // Apply client-side filtering as backup
      if (selectedType !== 'all') {
        filteredNotifications = filteredNotifications.filter(n => n.type === selectedType);
      }
      
      setNotifications(filteredNotifications);
      setTotalPages(response.notifications?.last_page || 1);
      
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = useCallback(async (notification) => {
    try {
      if (!notification.is_read) {
        setActionLoading(prev => ({ ...prev, [`read-${notification.id}`]: true }));
        
        // Simple optimistic update - just mark as read locally
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        setAllNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        
        // API call only - let real-time events handle the final state
        await markAsRead(notification.id);
        setActionLoading(prev => ({ ...prev, [`read-${notification.id}`]: false }));
      }
      
      // Navigate to the notification URL if available
      if (notification.action_url) {
        window.location.href = notification.action_url;
      }
    } catch (error) {
      console.error('Failed to handle notification click:', error);
      setActionLoading(prev => ({ ...prev, [`read-${notification.id}`]: false }));
      
      // On error, just reload data instead of full page
      try {
        await loadNotifications();
      } catch (reloadError) {
        console.error('Failed to reload notifications after error:', reloadError);
      }
    }
  }, [markAsRead, loadNotifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      setActionLoading(prev => ({ ...prev, 'markAllRead': true }));
      
      // Simple optimistic update
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setAllNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      await markAllAsRead();
      setActionLoading(prev => ({ ...prev, 'markAllRead': false }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      setActionLoading(prev => ({ ...prev, 'markAllRead': false }));
      
      // On error, just reload data instead of full page
      try {
        await loadNotifications();
      } catch (reloadError) {
        console.error('Failed to reload notifications after error:', reloadError);
      }
    }
  }, [markAllAsRead, loadNotifications]);

  const handleMarkTypeAsRead = useCallback(async () => {
    if (selectedType === 'all') return;
    
    try {
      setActionLoading(prev => ({ ...prev, 'markTypeRead': true }));
      
      // Simple optimistic update
      setNotifications(prev =>
        prev.map(n =>
          n.type === selectedType ? { ...n, is_read: true } : n
        )
      );
      setAllNotifications(prev =>
        prev.map(n =>
          n.type === selectedType ? { ...n, is_read: true } : n
        )
      );
      
      await markTypeAsRead(selectedType);
      setActionLoading(prev => ({ ...prev, 'markTypeRead': false }));
    } catch (error) {
      console.error('Failed to mark type as read:', error);
      setActionLoading(prev => ({ ...prev, 'markTypeRead': false }));
      
      // On error, just reload data instead of full page
      try {
        await loadNotifications();
      } catch (reloadError) {
        console.error('Failed to reload notifications after error:', reloadError);
      }
    }
  }, [markTypeAsRead, selectedType, loadNotifications]);

  const handleDeleteNotification = useCallback(async (notificationId, event) => {
    event.stopPropagation();
    
    try {
      setActionLoading(prev => ({ ...prev, [`delete-${notificationId}`]: true }));
      
      // Simple optimistic update - remove from UI immediately
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setAllNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // API call only - let real-time events handle the final state
      await deleteNotification(notificationId);
      
      // Clear loading state immediately after API success
      setActionLoading(prev => ({ ...prev, [`delete-${notificationId}`]: false }));
      
    } catch (error) {
      console.error('Failed to delete notification:', error);
      setActionLoading(prev => ({ ...prev, [`delete-${notificationId}`]: false }));
      
      // On error, restore the notification in UI
      try {
        await loadNotifications();
      } catch (reloadError) {
        console.error('Failed to reload notifications after error:', reloadError);
      }
    }
  }, [deleteNotification, loadNotifications]);

  const getNotificationIcon = (type) => {
    const iconMap = {
      'post_like': Heart,
      'post_comment': MessageCircle,
      'room_join_request': UserPlus,
      'order_placed': ShoppingCart,
      'payment_status': CreditCard,
      'system': Bell
    };
    return iconMap[type] || Bell;
  };

  // Count from all notifications for sidebar filters
  const getTypeCount = (type) => {
    if (type === 'all') return allNotifications.length;
    return allNotifications.filter(n => n.type === type).length;
  };

  // Get stats for the currently selected type
  const getStatsForSelectedType = () => {
    // For stats, always work with allNotifications to get accurate counts
    // If selectedType is 'all', use all notifications
    // If selectedType is specific, filter from allNotifications to get accurate counts
    let typeNotifications;
    
    if (selectedType === 'all') {
      typeNotifications = allNotifications;
    } else {
      typeNotifications = allNotifications.filter(n => n.type === selectedType);
    }
    
    let unread = typeNotifications.filter(n => !n.is_read);
    let read = typeNotifications.filter(n => n.is_read);
    
    return {
      total: typeNotifications.length,
      unread: unread.length,
      read: read.length
    };
  };

  // Filter notifications for display based on show/hide read toggle
  const displayNotifications = showRead ? notifications : notifications.filter(n => !n.is_read);
  const displayUnreadNotifications = displayNotifications.filter(n => !n.is_read);
  const stats = getStatsForSelectedType();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Stay updated with your latest activities
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {stats.unread > 0 && (
              <>
                {selectedType !== 'all' && (
                  <button
                    onClick={handleMarkTypeAsRead}
                    disabled={actionLoading.markTypeRead}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading.markTypeRead ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    <span>Mark {selectedType.replace('_', ' ')} as read</span>
                  </button>
                )}
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={actionLoading.markAllRead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading.markAllRead ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <CheckCheck size={16} />
                  )}
                  <span>Mark all as read</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats - Show counts for currently filtered notifications */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedType === 'all' ? 'Total' : `${selectedType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                </p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {stats.unread}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Read</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {stats.read}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Filter size={16} className="text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
            </div>
            
            {/* Type Filter */}
            <div className="space-y-2">
              {notificationTypes.map((type) => {
                const IconComponent = type.icon;
                const count = getTypeCount(type.value);
                
                return (
                  <button
                    key={type.value}
                    onClick={() => {
                      setSelectedType(type.value);
                      setCurrentPage(1);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      selectedType === type.value
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent size={16} />
                      <span className="text-sm font-medium">{type.label}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Show/Hide Read Toggle */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRead}
                  onChange={(e) => setShowRead(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Show read notifications
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {loading ? (
              <div className="p-8 text-center">
                <Loader className="mx-auto h-8 w-8 animate-spin text-gray-400" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading notifications...</p>
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No notifications found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedType === 'all' 
                    ? "You're all caught up! No notifications to show."
                    : `No ${selectedType.replace('_', ' ')} notifications to show.`
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {displayNotifications.map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type);
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-l-4 ${
                        notification.is_read 
                          ? 'border-l-transparent' 
                          : 'border-l-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      } ${actionLoading[`read-${notification.id}`] ? 'opacity-75' : ''}`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 p-3 rounded-full ${
                          notification.is_read 
                            ? 'bg-gray-200 dark:bg-gray-600' 
                            : 'bg-primary-100 dark:bg-primary-800'
                        }`}>
                          {actionLoading[`read-${notification.id}`] ? (
                            <Loader size={20} className="animate-spin text-primary-600" />
                          ) : (
                            <IconComponent 
                              size={20} 
                              className={`${
                                notification.is_read 
                                  ? 'text-gray-600 dark:text-gray-400' 
                                  : notification.color
                              }`} 
                            />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`font-medium ${
                                notification.is_read 
                                  ? 'text-gray-600 dark:text-gray-400' 
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {notification.title}
                              </p>
                              <p className={`mt-1 ${
                                notification.is_read 
                                  ? 'text-gray-500 dark:text-gray-500' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {notification.message}
                              </p>
                              
                              {notification.related_user && (
                                <div className="flex items-center mt-3 space-x-2">
                                  <Avatar user={notification.related_user} size="sm" />
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {notification.related_user.name}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-3 ml-4">
                              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {notification.timeAgo}
                              </span>
                              <button
                                onClick={(e) => handleDeleteNotification(notification.id, e)}
                                disabled={actionLoading[`delete-${notification.id}`]}
                                className="p-1 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete notification"
                              >
                                {actionLoading[`delete-${notification.id}`] ? (
                                  <Loader size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage; 