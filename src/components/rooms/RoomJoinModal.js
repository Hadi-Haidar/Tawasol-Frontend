import React, { useState } from 'react';
import { 
  XMarkIcon,
  UsersIcon,
  LockClosedIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import apiService from '../../services/apiService';
import Avatar from '../common/Avatar';

const RoomJoinModal = ({ room, isOpen, onClose, onJoinSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getTypeIcon = () => {
    switch (room?.type) {
      case 'public':
        return <GlobeAltIcon className="w-6 h-6 text-green-500" />;
      case 'private':
        return <LockClosedIcon className="w-6 h-6 text-orange-500" />;
      case 'secure':
        return <ShieldCheckIcon className="w-6 h-6 text-red-500" />;
      default:
        return <GlobeAltIcon className="w-6 h-6 text-green-500" />;
    }
  };

  const getTypeColor = () => {
    switch (room?.type) {
      case 'public':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'private':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'secure':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getJoinButtonText = () => {
    switch (room?.type) {
      case 'public':
        return 'Join Room';
      case 'private':
        return 'Request to Join';
      case 'secure':
        return 'Join with Password';
      default:
        return 'Join Room';
    }
  };

  const handleJoin = async () => {
    if (!room) return;

    setLoading(true);
    setError('');

    try {
      const payload = {};
      if (room.type === 'secure') {
        if (!password.trim()) {
          setError('Password is required for secure rooms');
          setLoading(false);
          return;
        }
        payload.password = password;
      }

      const response = await apiService.post(`/rooms/${room.id}/join`, payload);

      if (response.success) {
        // Success - close modal and notify parent
        onJoinSuccess?.(response.message);
        
        // Handle different room types after successful join
        if (room.type === 'private') {
          // For private rooms, don't close modal immediately to show success message
          setTimeout(() => {
            onClose();
            setPassword('');
            setError('');
          }, 2000); // Close modal after 2 seconds to show the success message
        } else {
          // For public and secure rooms, close modal immediately
          onClose();
          setPassword('');
          setError('');
        }
      } else {
        setError(response.message || 'Failed to join room');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Join Room
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Room Image */}
          <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden mb-6">
            {room.image_url ? (
              <img 
                src={room.image_url} 
                alt={room.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-white text-3xl font-bold opacity-30">
                  {room.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}

            {/* Commercial Badge */}
            {room.is_commercial && (
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  <ShoppingBagIcon className="w-3 h-3 mr-1" />
                  Commercial
                </span>
              </div>
            )}

            {/* Type Badge */}
            <div className="absolute top-3 right-3">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor()}`}>
                {getTypeIcon()}
                <span className="ml-2 capitalize">{room.type}</span>
              </div>
            </div>
          </div>

          {/* Room Info */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {room.name}
            </h2>

            {room.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {room.description}
              </p>
            )}

            {/* Room Stats */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center">
                <UsersIcon className="w-4 h-4 mr-1" />
                <span>{room.members_count || 0} members</span>
              </div>
              
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span>{formatDistanceToNow(new Date(room.created_at), { addSuffix: true })}</span>
              </div>
            </div>

            {/* Owner Info */}
            <div className="flex items-center">
              <Avatar 
                user={room.owner} 
                size="sm" 
                className="mr-3" 
                showBorder={false}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Created by {room.owner?.name || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Password input for secure rooms */}
          {room.type === 'secure' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter room password"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white pr-10"
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
            </div>
          )}

          {/* Room type explanation */}
          <div className="mb-6">
            {room.type === 'public' && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md p-3">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Public Room:</strong> Anyone can join immediately. You'll be added as a member right away.
                </p>
              </div>
            )}
            
            {room.type === 'private' && (
              <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-md p-3">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  <strong>Private Room:</strong> Your request will be sent to the room owner for approval. You will not be redirected until approved.
                </p>
              </div>
            )}
            
            {room.type === 'secure' && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Secure Room:</strong> Enter the correct password to join immediately.
                </p>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            
            <button
              onClick={handleJoin}
              disabled={loading || (room.type === 'secure' && !password.trim())}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : getJoinButtonText()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomJoinModal; 