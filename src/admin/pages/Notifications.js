import React, { useState, useEffect, memo } from 'react';
import { 
  Bell,
  Send,
  Users,
  Target,
  Calendar,
  Eye,
  Trash2,
  AlertCircle,
  Crown,
  Star,
  Circle,
  Home,
  Loader,
  Mail
} from 'lucide-react';
import adminNotificationService from '../../services/adminNotificationService';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';

// 🚀 CRITICAL FIX: Move CreateNotificationModal OUTSIDE the main component to prevent recreation
const CreateNotificationModal = React.memo(({
  showCreateModal,
  onClose,
  newNotification,
  setNewNotification,
  handleCreateNotification,
  loading,
  notificationTypes,
  targetAudiences,
  getAudienceCount
}) => {
  if (!showCreateModal) return null;

  const handleTitleChange = (e) => {
    setNewNotification(prev => ({ ...prev, title: e.target.value }));
  };

  const handleMessageChange = (e) => {
    setNewNotification(prev => ({ ...prev, message: e.target.value }));
  };

  const handleTypeChange = (e) => {
    setNewNotification(prev => ({ ...prev, type: e.target.value }));
  };

  const handleAudienceChange = (e) => {
    setNewNotification(prev => ({ ...prev, target_audience: e.target.value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Notification</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close modal"
            title="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="notification-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="notification-title"
              value={newNotification.title}
              onChange={handleTitleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter notification title"
              aria-required="true"
              aria-describedby="title-help"
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="notification-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message *
            </label>
            <textarea
              id="notification-message"
              value={newNotification.message}
              onChange={handleMessageChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter notification message"
              aria-required="true"
              aria-describedby="message-help"
            />
          </div>

          {/* Type and Target Audience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="notification-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                id="notification-type"
                value={newNotification.type}
                onChange={handleTypeChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="type-help"
              >
                {notificationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="notification-audience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Audience
              </label>
              <select
                id="notification-audience"
                value={newNotification.target_audience}
                onChange={handleAudienceChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="audience-help"
              >
                {targetAudiences.map(audience => (
                  <option key={audience.value} value={audience.value}>{audience.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Audience Preview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-2">
              <Target size={16} />
              <span className="font-medium">Audience Preview</span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              This notification will be sent to approximately <strong>
                {getAudienceCount(newNotification.target_audience) === '?' 
                  ? 'unknown number of' 
                  : getAudienceCount(newNotification.target_audience)
                }
              </strong> users in the "{newNotification.target_audience}".
              {getAudienceCount(newNotification.target_audience)
                }
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            type="button"
            aria-label="Cancel notification creation"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateNotification}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center space-x-2"
            disabled={loading}
            type="button"
            aria-label={loading ? 'Sending notification...' : 'Send notification now'}
          >
            <Send size={16} />
            <span>{loading ? 'Sending...' : 'Send Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

const Notifications = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'System',
    target_audience: 'All Users'
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    total_reads: 0
  });

  const [notificationTypes, setNotificationTypes] = useState([]);
  const [targetAudiences, setTargetAudiences] = useState([]);

  // Load notifications, types, and audiences on component mount
  useEffect(() => {
    loadNotifications();
    loadNotificationTypes();
    loadTargetAudiences();
    loadStats();
  }, []);

  const loadNotifications = async () => {
    try {
      setPageLoading(true);
      const response = await adminNotificationService.getNotifications();
      
      // Handle Laravel paginated response structure
      if (response.notifications && typeof response.notifications === 'object') {
        // Laravel paginator puts data in .data property
        const notificationsArray = response.notifications.data || response.notifications || [];
        setNotifications(notificationsArray);
      } else {
        setNotifications([]);
      }
      
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Show empty state with error message
      setNotifications([]);
    } finally {
      setPageLoading(false);
    }
  };

  const loadNotificationTypes = async () => {
    try {
      const response = await adminNotificationService.getNotificationTypes();
      setNotificationTypes(response.types || []);
    } catch (error) {
      console.error('Failed to load notification types:', error);
      // Set empty array - server required for notification types
      setNotificationTypes([]);
    }
  };

    const loadTargetAudiences = async () => {
    try {
      const response = await adminNotificationService.getTargetAudiences();
      setTargetAudiences(response.audiences || []);
    } catch (error) {
      console.error('Failed to load target audiences:', error);
      // Set empty array - server required for target audiences
      setTargetAudiences([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminNotificationService.getNotificationStats();
      setStats(response.stats || stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Keep default stats but could show server error
      setStats({
        total: '?',
        sent: '?',
        total_reads: '?'
      });
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'System': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Feature': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'Policy': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Promotion': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Warning': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Sent': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'Scheduled': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Failed': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getAudienceIcon = (audience) => {
    switch (audience) {
      case 'All Users': return <Users size={16} className="text-blue-500" />;
      case 'Gold Users': return <Crown size={16} className="text-yellow-500" />;
      case 'Silver Users': return <Star size={16} className="text-gray-500" />;
      case 'Bronze Users': return <Circle size={16} className="text-orange-500" />;
      case 'Room Owners': return <Home size={16} className="text-purple-500" />;
      case 'New Users': return <Users size={16} className="text-green-500" />;
      default: return <Users size={16} className="text-gray-500" />;
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      showWarning('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await adminNotificationService.createNotification(newNotification);
      
      // Handle both successful API response and fallback mode
      if (response && (response.success !== false)) {
        const audienceCount = getAudienceCount(newNotification.target_audience);
        const countText = audienceCount === '?' ? 'users (count unknown - server required)' : `${audienceCount} users`;
        const message = response.message || 
          `Notification sent immediately to ${countText} in "${newNotification.target_audience}" group (excluding admin)!`;
        
        showSuccess(message);
        
        setNewNotification({
          title: '',
          message: '',
          type: 'System',
          target_audience: 'All Users'
        });
        setShowCreateModal(false);
        
        // Reload to get fresh data from server immediately
        await loadNotifications();
        await loadStats();
      } else {
        showError(response.message || 'Failed to create notification');
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
      showError('Failed to create notification. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAudienceCount = (audience) => {
    const audienceData = targetAudiences.find(a => a.value === audience);
    if (!audienceData) return '?';
    return audienceData.count === '?' ? '?' : audienceData.count;
  };

  const handleDeleteNotification = (id) => {
    setNotificationToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteNotification = async () => {
    if (!notificationToDelete) return;
    
    try {
      const response = await adminNotificationService.deleteNotification(notificationToDelete);
      if (response.success) {
        showSuccess(response.message || 'Notification deleted successfully');
        await loadNotifications();
        await loadStats();
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      showError('Failed to delete notification. Please try again.');
    } finally {
      setShowDeleteConfirm(false);
      setNotificationToDelete(null);
    }
  };

  const cancelDeleteNotification = () => {
    setShowDeleteConfirm(false);
    setNotificationToDelete(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Send system-wide notifications to users
          </p>
          {stats.total === '?' && (
            <div className="flex items-center space-x-2 mt-2 text-yellow-600 dark:text-yellow-400 text-sm">
              <AlertCircle size={14} />
              <span>Laravel server required for real data (php artisan serve --port=8000)</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Bell size={16} />
          <span>Create Notification</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Send size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.sent || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sent</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Eye size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.total_reads || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Reads</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Notifications</h3>
        </div>

        {pageLoading ? (
          <div className="p-12 text-center">
            <Loader className="mx-auto h-8 w-8 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => {
              const status = 'Sent';
              
              return (
              <div key={notification.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </h4>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.admin_notification_type || notification.type)}`}>
                        {notification.admin_notification_type || notification.type}
                      </span>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                      {!notification.is_individual && (notification.data?.target_audience || notification.target_audience) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">
                          <Target size={12} className="mr-1" />
                          {notification.data?.target_audience || notification.target_audience}
                        </span>
                      )}
                      {notification.is_individual && notification.recipient_email && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
                          <Mail size={12} className="mr-1" />
                          {notification.recipient_name ? `${notification.recipient_name} (${notification.recipient_email})` : notification.recipient_email}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Users size={16} />
                        <span>{notification.recipient_count || 1} recipients</span>
                      </div>
                      {notification.read_count !== undefined && (
                        <div className="flex items-center space-x-1">
                          <Eye size={16} />
                          <span>{notification.read_count} reads</span>
                          <span className="text-green-600 dark:text-green-400">
                            ({Math.round((notification.read_count / (notification.recipient_count || 1)) * 100)}%)
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Calendar size={16} />
                        <span>
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>

                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}

        {!pageLoading && notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No notifications</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {stats.total === '?' 
                ? 'Start Laravel server (php artisan serve --port=8000) to load real notification data'
                : 'Create your first notification to get started'
              }
            </p>
            {stats.total === '?' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200 text-sm">
                  <AlertCircle size={16} />
                  <span className="font-medium">Server Required</span>
                </div>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                  Run <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">php artisan serve --port=8000</code> to get real user counts and data.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Notification Modal */}
      <CreateNotificationModal
        showCreateModal={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        newNotification={newNotification}
        setNewNotification={setNewNotification}
        handleCreateNotification={handleCreateNotification}
        loading={loading}
        notificationTypes={notificationTypes}
        targetAudiences={targetAudiences}
        getAudienceCount={getAudienceCount}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={cancelDeleteNotification}
        onConfirm={confirmDeleteNotification}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This will delete all instances of this notification for all users."
        confirmText="Delete Notification"
        cancelText="Cancel"
        confirmStyle="danger"
        loading={false}
      />
    </div>
  );
};

export default Notifications; 