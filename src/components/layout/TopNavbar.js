import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  Bell, 
  Settings, 
  Moon, 
  Sun, 
  Menu,
  User,
  Heart,
  MessageCircle,
  UserPlus,
  ShoppingCart,
  CreditCard,
  X
} from 'lucide-react';
import Avatar from '../common/Avatar';

const TopNavbar = ({ onMobileMenuToggle, isMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }
      
      // Navigate to the notification URL if available
      if (notification.action_url) {
        window.location.href = notification.action_url;
      }
      
      setShowNotifications(false);
    } catch (error) {
      console.error('Failed to handle notification click:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

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

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left side - Mobile menu button */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right side - Actions and user menu */}
      <div className="flex items-center space-x-4">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <Bell className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {notifications.map((notification) => {
                      const IconComponent = getNotificationIcon(notification.type);
                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-l-4 transition-colors duration-200 ${
                            notification.is_read 
                              ? 'border-l-transparent bg-gray-50 dark:bg-gray-800' 
                              : 'border-l-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 p-2 rounded-full ${
                              notification.is_read 
                                ? 'bg-gray-200 dark:bg-gray-600' 
                                : 'bg-primary-100 dark:bg-primary-800'
                            }`}>
                              <IconComponent 
                                size={16} 
                                className={`${
                                  notification.is_read 
                                    ? 'text-gray-600 dark:text-gray-400' 
                                    : notification.color
                                }`} 
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium ${
                                  notification.is_read 
                                    ? 'text-gray-600 dark:text-gray-400' 
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {notification.title}
                                </p>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                  {notification.timeAgo}
                                </span>
                              </div>
                              <p className={`text-sm mt-1 ${
                                notification.is_read 
                                  ? 'text-gray-500 dark:text-gray-500' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {notification.message}
                              </p>
                              {notification.related_user && (
                                <div className="flex items-center mt-2 space-x-2">
                                  <Avatar user={notification.related_user} size="xs" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {notification.related_user.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href="/user/notifications"
                    className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500"
                    onClick={() => setShowNotifications(false)}
                  >
                    View all notifications
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative group">
          <button className="flex items-center space-x-3 p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-sm">
            <Avatar user={user} size="md" />
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{user?.email}</p>
            </div>
          </button>

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="py-2">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <Avatar user={user} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="py-1">
                <a href="/user/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </a>
                <a href="/user/subscription-payment" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </a>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                <button
                  onClick={async () => {
                    try {
                      await logout();
                    } catch (error) {
                      console.error('Logout error:', error);
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;