import React, { useState } from 'react';
import { 
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  ClockIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../common/Avatar';
import DirectMessageModal from '../chat/DirectMessageModal';

const UserProfileModal = ({ user, isOpen, onClose, currentUser, room }) => {
  const [showDirectMessage, setShowDirectMessage] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  if (!isOpen || !user) return null;

  const handleStartDirectMessage = async () => {
    try {
      setIsStartingChat(true);
      // Small delay for better UX feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      setShowDirectMessage(true);
    } catch (error) {
      console.error('Failed to start direct message:', error);
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleCloseDirectMessage = () => {
    setShowDirectMessage(false);
  };

  // Don't show DM button if it's the current user viewing their own profile
  const canStartDirectMessage = currentUser && user && currentUser.id !== user.id;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-t-xl">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <Avatar 
                  user={user} 
                  size="2xl" 
                  showBorder={true}
                />
                {/* Online indicator - Design Only */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-400 border-4 border-white rounded-full"></div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                {user.name}
              </h2>
              
              {user.last_seen && (
                <p className="text-white/80 text-sm">
                  Last active {formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })}
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-gray-500" />
                Profile Information
              </h3>
              
              <div className="space-y-3">
                {user.email && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                )}
                
                {user.last_seen && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Last Activity</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2 text-gray-500" />
                Status
              </h3>
              
              {/* Online Status - Design Only */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Member of this room</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h3>
              
              <div className="space-y-3">
                {canStartDirectMessage && (
                  <button
                    onClick={handleStartDirectMessage}
                    disabled={isStartingChat}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] disabled:scale-100"
                  >
                    {isStartingChat ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Starting Chat...</span>
                      </>
                    ) : (
                      <>
                        <ChatBubbleLeftIcon className="w-5 h-5" />
                        <span>Start Direct Message</span>
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Message Modal */}
      <DirectMessageModal
        targetUser={user}
        currentUser={currentUser}
        room={room}
        isOpen={showDirectMessage}
        onClose={handleCloseDirectMessage}
      />
    </>
  );
};

export default UserProfileModal; 