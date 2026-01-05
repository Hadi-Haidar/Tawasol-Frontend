import React, { useState } from 'react';
import { 
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import chatApiService from '../../services/chatApi';
import RoomUsageInfo from '../rooms/RoomUsageInfo';

const CreateChatRoomModal = ({ onClose, onChatRoomCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [usageRefreshTrigger, setUsageRefreshTrigger] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    participants: []
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Chat room name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Chat room name must be less than 255 characters';
    }

    if (formData.participants.length === 0) {
      newErrors.participants = 'At least one participant is required';
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
      const submitData = {
        name: formData.name,
        description: formData.description,
        participants: formData.participants
      };

      const response = await chatApiService.createChatRoom(submitData);

      // Handle successful response with new format
      const { room, usage_info, cost_info, message } = response;
      
      // Set success message
      setSuccessMessage(message || 'Chat room created successfully!');
      
      // Refresh usage info
      setUsageRefreshTrigger(prev => prev + 1);
      
      // Call parent callback
      if (onChatRoomCreated) {
        onChatRoomCreated(room, { usage_info, cost_info });
      }

      // Optional: Auto-close after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating chat room:', error);
      
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
        setErrors({ general: 'Failed to create chat room. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = (email) => {
    if (!email.trim()) return;
    
    if (formData.participants.includes(email)) {
      setErrors(prev => ({ ...prev, participants: 'Participant already added' }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, email]
    }));
    
    setErrors(prev => ({ ...prev, participants: null }));
  };

  const removeParticipant = (email) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== email)
    }));
  };

  const handleParticipantKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addParticipant(e.target.value);
      e.target.value = '';
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2" />
                Create Chat Room
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
                {/* Chat Room Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chat Room Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter chat room name..."
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
                    placeholder="Describe your chat room..."
                  />
                </div>

                {/* Participants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Participants *
                  </label>
                  
                  {/* Add participant input */}
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="email"
                      onKeyPress={handleParticipantKeyPress}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter participant email and press Enter..."
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.target.previousElementSibling;
                        addParticipant(input.value);
                        input.value = '';
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                    >
                      <UserPlusIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Participants list */}
                  {formData.participants.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {formData.participants.map((email, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                          <span className="text-sm text-gray-900 dark:text-white">{email}</span>
                          <button
                            type="button"
                            onClick={() => removeParticipant(email)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {errors.participants && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.participants}</p>
                  )}
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
                    {loading ? 'Creating...' : 'Create Chat Room'}
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

export default CreateChatRoomModal; 