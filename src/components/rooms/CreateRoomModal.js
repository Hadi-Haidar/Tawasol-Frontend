import React, { useState } from 'react';
import { 
  XMarkIcon,
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';
import RoomUsageInfo from './RoomUsageInfo';

const CreateRoomModal = ({ onClose, onRoomCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usageRefreshTrigger, setUsageRefreshTrigger] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public',
    password: '',
    is_commercial: false,
    image: null
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    
    // Clear success message when user makes changes
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setErrors(prev => ({ ...prev, image: 'Image size must be less than 2MB' }));
        return;
      }
      
      setFormData(prev => ({ ...prev, image: file }));
      setErrors(prev => ({ ...prev, image: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Room name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Room name must be less than 255 characters';
    }

    if (formData.type === 'secure' && !formData.password) {
      newErrors.password = 'Password is required for secure rooms';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.is_commercial && user?.subscription_level !== 'gold') {
      newErrors.is_commercial = 'Only Gold subscribers can create commercial rooms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('type', formData.type);
      submitData.append('is_commercial', formData.is_commercial ? '1' : '0');
      
      if (formData.type === 'secure' && formData.password) {
        submitData.append('password', formData.password);
      }
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      const response = await apiService.post('/rooms', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Handle successful response with new format// Handle different response structures
      const responseData = response.data || response;
      const room = responseData.room || responseData;
      const usage_info = responseData.usage_info;
      const cost_info = responseData.cost_info;
      const message = responseData.message;
      
      // Set success message
      setSuccessMessage(message || 'Room created successfully!');
      
      // Refresh usage info
      setUsageRefreshTrigger(prev => prev + 1);
      
      // Call parent callback
      if (onRoomCreated) {
        onRoomCreated(room, { usage_info, cost_info });
      }

      // Optional: Auto-close after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating room:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.error || error.response?.data?.message) {
        const errorMessage = error.response.data.error || error.response.data.message;
        
        // Check if it's a coin-related error
        if (errorMessage.includes('Insufficient coins') || errorMessage.includes('coins')) {
          setErrors({ 
            general: errorMessage,
            type: 'coins'
          });
        } else {
          setErrors({ general: errorMessage });
        }
        
        // Refresh usage info on error to show updated data
        setUsageRefreshTrigger(prev => prev + 1);
      } else {
        setErrors({ general: 'Failed to create room. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Room
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex">
            {/* Form Section */}
            <div className="flex-1 p-6">
              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" />
                    <span className="text-sm text-green-700 dark:text-green-300">{successMessage}</span>
                  </div>
                </div>
              )}

              {/* General Error */}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 dark:text-red-400 mr-2 mt-0.5" />
                    <div className="text-sm text-red-700 dark:text-red-300">
                      {errors.general}
                      {errors.type === 'coins' && (
                        <div className="mt-2 text-xs">
                          Check your coin balance or consider purchasing more coins to continue.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Room Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter room name..."
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Describe your room..."
                  />
                </div>

                {/* Room Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Room Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="public">Public - Anyone can join</option>
                    <option value="private">Private - Requires approval</option>
                    <option value="secure">Secure - Requires password</option>
                  </select>
                </div>

                {/* Password (for secure rooms) */}
                {formData.type === 'secure' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Room Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter password..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                    )}
                  </div>
                )}

                {/* Commercial Room */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_commercial"
                    id="is_commercial"
                    checked={formData.is_commercial}
                    onChange={handleInputChange}
                    disabled={user?.subscription_level !== 'gold'}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
                  />
                  <label htmlFor="is_commercial" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Commercial Room 
                    {user?.subscription_level !== 'gold' && (
                      <span className="text-gray-500 dark:text-gray-400">(Gold subscription required)</span>
                    )}
                  </label>
                </div>
                {errors.is_commercial && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.is_commercial}</p>
                )}

                {/* Room Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Room Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                      <PhotoIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.image ? formData.image.name : 'Choose image'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {formData.image && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {errors.image && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.image}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF up to 2MB
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200 flex items-center"
                  >
                    {loading ? 'Creating...' : 'Create Room'}
                  </button>
                </div>
              </form>
            </div>

            {/* Usage Info Sidebar */}
            <div className="w-80 bg-gray-50 dark:bg-gray-900 p-6 border-l border-gray-200 dark:border-gray-700">
              <RoomUsageInfo 
                refreshTrigger={usageRefreshTrigger}
                className="sticky top-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal; 