import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import adminService from '../../services/adminService';
import { adminNotificationService } from '../../services/adminNotificationService';

const SendNotificationModal = ({ isOpen, onClose, user, onNotificationSent }) => {
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    type: 'System'
  });
  const [loading, setLoading] = useState(false);
  const [notificationTypes, setNotificationTypes] = useState([]);
  const [error, setError] = useState('');

  // Load notification types
  useEffect(() => {
    if (isOpen) {
      loadNotificationTypes();
    }
  }, [isOpen]);

  const loadNotificationTypes = async () => {
    try {
      const response = await adminNotificationService.getNotificationTypes();
      setNotificationTypes(response.types || ['System', 'Feature', 'Policy', 'Promotion', 'Warning']);
    } catch (error) {
      console.error('Failed to load notification types:', error);
      setNotificationTypes(['System', 'Feature', 'Policy', 'Promotion', 'Warning']);
    }
  };

  const handleInputChange = (field, value) => {
    setNotification(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  const handleSendNotification = async () => {
    // Validation
    if (!notification.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!notification.message.trim()) {
      setError('Message is required');
      return;
    }
    if (notification.title.length > 255) {
      setError('Title must be less than 255 characters');
      return;
    }
    if (notification.message.length > 1000) {
      setError('Message must be less than 1000 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await adminService.sendNotificationToUser(user.id, notification);
      
      if (response.success) {
        // Reset form
        setNotification({
          title: '',
          message: '',
          type: 'System'
        });
        
        // Call success callback
        if (onNotificationSent) {
          onNotificationSent(response.message);
        }
        
        // Close modal
        onClose();
      } else {
        setError(response.message || 'Failed to send notification');
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      setError(err.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setNotification({
        title: '',
        message: '',
        type: 'System'
      });
      setError('');
      onClose();
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Send Notification
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Send a notification to <span className="font-medium">{user.name}</span> ({user.email})
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Notification Type */}
          <div>
            <label htmlFor="notification-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              id="notification-type"
              value={notification.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              {notificationTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="notification-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="notification-title"
              value={notification.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={loading}
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Enter notification title"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {notification.title.length}/255 characters
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="notification-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="notification-message"
              value={notification.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              disabled={loading}
              maxLength={1000}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none"
              placeholder="Enter notification message"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {notification.message.length}/1000 characters
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSendNotification}
            disabled={loading || !notification.title.trim() || !notification.message.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Send Notification</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendNotificationModal; 