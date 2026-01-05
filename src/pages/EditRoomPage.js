import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import {
  ArrowLeftIcon,

  XMarkIcon
} from '@heroicons/react/24/outline';

const EditRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public',
    is_commercial: false,
    password: '',
    image: null
  });

  useEffect(() => {
    fetchRoomData();
  }, [roomId]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      const roomResponse = await apiService.get(`/rooms/${roomId}`);
      const roomData = roomResponse.room || roomResponse.data;
      
      // Check if user is the owner
      if (roomData.owner_id !== user.id) {
        navigate(`/user/rooms/${roomId}`);
        return;
      }
      
      setRoom(roomData);
      setFormData({
        name: roomData.name || '',
        description: roomData.description || '',
        type: roomData.type || 'public',
        is_commercial: roomData.is_commercial || false,
        password: '',
        image: null
      });
      
    } catch (error) {
      console.error('Error fetching room data:', error);
      showNotification('Failed to load room data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Room name is required';
    }
    
    if (formData.type === 'secure' && !formData.password && room.type !== 'secure') {
      errors.password = 'Password is required when changing to secure room type';
    }
    
    if (formData.type === 'secure' && formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification('Please fix the validation errors', 'error');
      return;
    }
    
    setSubmitting(true);

    try {
      const submitData = new FormData();
      
      // Add _method field for Laravel method spoofing
      submitData.append('_method', 'PUT');
      
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

      // Debug logging// Use POST with method spoofing instead of PUT for FormData
      await apiService.post(`/rooms/${roomId}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showNotification('Room updated successfully!');
      setTimeout(() => {
        navigate(`/user/rooms/${roomId}/manage`);
      }, 2000);

    } catch (error) {
      console.error('Error updating room:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to update room';
      showNotification(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Room not found</h2>
          <button
            onClick={() => navigate('/user/rooms')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`max-w-sm px-4 py-3 rounded-lg shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => setNotification(null)}
                className="ml-3 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
                                onClick={() => navigate(`/user/rooms/${roomId}/manage`)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Room: {room.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Update your room settings and information
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Room Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Image
              </label>
              <div className="flex items-center space-x-4">
                {room.image_url && (
                  <img 
                    src={room.image_url} 
                    alt={room.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Upload a new image to replace the current one (optional)
                  </p>
                </div>
              </div>
            </div>

            {/* Room Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  validationErrors.name 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter room name"
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.name}</p>
              )}
            </div>

            {/* Room Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Describe your room..."
              />
            </div>

            {/* Room Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="public">Public - Anyone can join</option>
                <option value="private">Private - Requires approval</option>
                <option value="secure">Secure - Password protected</option>
              </select>
            </div>

            {/* Password for Secure Rooms */}
            {formData.type === 'secure' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Password {room.type !== 'secure' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    validationErrors.password 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={room.type === 'secure' ? "Enter new password (leave empty to keep current)" : "Enter password for secure room"}
                />
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.password}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {room.type === 'secure' 
                    ? 'Leave empty to keep the current password' 
                    : 'Password is required when changing to secure room type'
                  }
                </p>
              </div>
            )}

            {/* Commercial Room */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_commercial"
                name="is_commercial"
                checked={formData.is_commercial}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="is_commercial" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Commercial Room (enables product features)
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-6">
              <button
                type="button"
                onClick={() => navigate(`/user/rooms/${roomId}/manage`)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Updating...' : 'Update Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditRoomPage; 