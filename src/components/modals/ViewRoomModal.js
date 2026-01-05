import React, { useState, useEffect } from 'react';
import { X, Users, Lock, Globe, UserPlus, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/apiService';

const ViewRoomModal = ({ room, isOpen, onClose, onSuccess, onError }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCheckingMembership, setIsCheckingMembership] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [membershipChecked, setMembershipChecked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isSecureRoom, setIsSecureRoom] = useState(false);
  const [roomDetails, setRoomDetails] = useState(null);

  useEffect(() => {
    if (isOpen && room && user) {
      checkMembership();
      fetchRoomDetails(); // Fetch fresh room data when modal opens
      // Reset password and error when modal opens
      setPassword('');
      setError('');
    }
  }, [isOpen, room, user]);

  const fetchRoomDetails = async () => {
    try {
      const response = await apiService.get(`/rooms/${room.id}`);
      setRoomDetails(response.room || response);} catch (error) {
      console.error('❌ Error fetching room details:', error);
      // Fallback to the room data passed as prop
      setRoomDetails(room);
    }
  };

  const checkMembership = async () => {
    setIsCheckingMembership(true);
    setMembershipChecked(false);
    setError('');try {
      const url = `/rooms/${room.id}/check-membership`;const response = await apiService.get(url);setIsMember(response.is_member || false);} catch (error) {
      console.error('❌ Error checking membership:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      
      setIsMember(false);
      
      // More specific error messages
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        setError('Room not found or endpoint not available.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to check membership status. Check console for details.');
      }
    } finally {
      setIsCheckingMembership(false);
      setMembershipChecked(true);
    }
  };

  const handleOpenRoom = () => {
            navigate(`/user/rooms/${room.id}`);
    onClose();
  };

  const handleJoinRoom = async () => {
    setIsJoining(true);
    setError('');

    // Check if this is a secure room and password is required
    if (currentRoom.type === 'secure' && !password.trim()) {
      setError('Password is required for this secure room.');
      setIsJoining(false);
      return;
    }try {
      // For secure rooms, include password in payload
      const payload = currentRoom.type === 'secure' ? { password } : {};const response = await apiService.post(`/rooms/${currentRoom.id}/join`, payload);// apiService already returns response.data, so we access properties directly
      const message = response.message || 'Successfully joined the room!';
      
      if (onSuccess) {
        onSuccess(message);
      }
      
      // Handle different room types after successful join
      if (currentRoom.type === 'private') {
        // For private rooms, show notification and DON'T redirect
        // User stays on the same page - NO NAVIGATION!
        handleCloseModal(); // Close modal immediately, success message handled by parent
      } else {
        // For public and secure rooms, navigate to room after successful join
                  navigate(`/user/rooms/${currentRoom.id}`);
        handleCloseModal();
      }
      
    } catch (error) {
      console.error('❌ Error joining room:', error);
      console.error('❌ Error response:', error.response);
      
      const errorMessage = error.response?.data?.message || 'Failed to join room';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    // Reset states when closing modal
    setPassword('');
    setError('');
    onClose();
  };

  // Use fresh room details if available, otherwise fall back to prop
  const currentRoom = roomDetails || room;

  const getRoomTypeInfo = () => {
    switch (currentRoom?.type) {
      case 'public':
        return {
          icon: <Globe className="w-5 h-5 text-green-600" />,
          label: 'Public Room',
          description: 'Anyone can join this room'
        };
      case 'secure':
        return {
          icon: <Lock className="w-5 h-5 text-yellow-600" />,
          label: 'Secure Room',
          description: 'Enter the room password to join'
        };
      case 'private':
        return {
          icon: <Users className="w-5 h-5 text-blue-600" />,
          label: 'Private Room',
          description: 'Request approval from the room owner'
        };
      default:
        return {
          icon: <Users className="w-5 h-5 text-gray-600" />,
          label: 'Room',
          description: 'Room access'
        };
    }
  };

  if (!isOpen || !room) return null;

  const roomTypeInfo = getRoomTypeInfo();

  // Debug logging to check room data
  console.log('Room data:', currentRoom);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              {isMember ? (
                <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Access Room
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isCheckingMembership ? 'Checking access...' : 
                 isMember ? 'You are a member of this room' : 'Join this room to access content'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Room Info */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                {currentRoom.image_url ? (
                  <img
                    src={currentRoom.image_url}
                    alt={currentRoom.name}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {currentRoom.name}
                </h3>
                <div className="flex items-center space-x-2 text-sm">
                  {roomTypeInfo.icon}
                  <span className="text-gray-600 dark:text-gray-400">
                    {roomTypeInfo.label}
                  </span>
                </div>
              </div>
            </div>
            
            {!isMember && membershipChecked && (
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                {roomTypeInfo.description}
              </p>
            )}
          </div>

          {/* Loading State */}
          {isCheckingMembership && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Checking membership status...
                </p>
              </div>
            </div>
          )}

          {/* Member Content */}
          {membershipChecked && isMember && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✅ You have access to this room. Click below to open it.
                </p>
              </div>
              
              <button
                onClick={handleOpenRoom}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Room</span>
              </button>
            </div>
          )}

          {/* Non-Member Content */}
          {membershipChecked && !isMember && (
            <div className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Password Input (show immediately for secure rooms) */}
              {currentRoom.type === 'secure' && (
                <div>
                  <label 
                    htmlFor="room-password" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Room Password
                  </label>
                  <input
                    type="password"
                    id="room-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Enter room password"
                    disabled={isJoining}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCloseModal}
                  disabled={isJoining}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={isJoining || (currentRoom.type === 'secure' && !password.trim())}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {currentRoom.type === 'private' ? 'Sending Request...' : 'Joining...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>
                        {currentRoom.type === 'private' ? 'Send Request' : 'Join Room'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Additional Info */}
              {currentRoom.type === 'private' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    💡 Your join request will be sent to the room owner for approval. You will not be redirected until approved.
                  </p>
                </div>
              )}
              
              {currentRoom.type === 'secure' && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    🔒 Enter the correct password to join this secure room immediately.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewRoomModal; 