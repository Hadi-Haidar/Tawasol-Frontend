import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  UsersIcon,
  LockClosedIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import RoomTabs from './RoomTabs';
import RoomPosts from './tabs/RoomPosts';
import RoomChat from './tabs/RoomChat';
import RoomProducts from './tabs/RoomProducts';
import JoinRoomForm from './JoinRoomForm';
import RoomMembersModal from './RoomMembersModal';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';

// Utility function to check if user is a member
const checkUserMembership = (room, userId) => {
  if (!room || !userId) return false;
  
  // Check in members array with different possible structures
  if (room.members?.some(member => 
    (member.user?.id || member.user_id || member.id) === userId
  )) {
    return true;
  }
  
  // Check in member_ids array
  if (room.member_ids?.includes(userId)) {
    return true;
  }
  
  return false;
};

const RoomModal = ({ room, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  const [roomData, setRoomData] = useState(room);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  useEffect(() => {
    if (user && roomData) {
      setIsOwner(roomData.owner_id === user.id);
      
      // Check initial membership from room data
      const initialMembership = checkUserMembership(roomData, user.id);
      setIsMember(initialMembership);
      
      // Fetch updated room details to confirm membership
      checkMembershipStatus();
    }
  }, [user, roomData]);

  const checkMembershipStatus = async () => {
    try {
      // Check if user is already a member by looking at the room details
      const response = await apiService.get(`/rooms/${roomData.id}`);
      
      // Handle different response structures
      const roomDetails = response.data?.room || response.room || response.data || response;
      
      // Check if current user is in the members list
      const currentUserMembership = roomDetails.members?.find(
        member => (member.user?.id || member.id) === user.id
      );
      
      if (currentUserMembership) {
        setIsMember(true);
        setMembershipStatus(currentUserMembership.status || 'approved');
      } else {
        setIsMember(false);
        setMembershipStatus(null);
      }
    } catch (error) {
      console.error('Error checking membership status:', error);
      // If there's an error, assume not a member
      setIsMember(false);
      setMembershipStatus(null);
    }
  };

  const handleJoinRoom = async (password = null) => {
    setLoading(true);
    try {
      const payload = password ? { password } : {};
      const response = await apiService.post(`/rooms/${roomData.id}/join`, payload);
      
      // Refresh membership status
      await checkMembershipStatus();
      setShowJoinForm(false);
      
      // Show success message based on room type and response
      const message = response.data?.message || response.message;
      if (message) {
        alert(message);
      } else if (roomData.type === 'private') {
        alert('Join request sent! Waiting for approval.');
      } else {
        alert('Successfully joined the room!');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      const errorMessage = error.response?.data?.message || 'Failed to join room';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = () => {
    switch (roomData.type) {
      case 'public':
        return <GlobeAltIcon className="w-5 h-5 text-green-500" />;
      case 'private':
        return <LockClosedIcon className="w-5 h-5 text-orange-500" />;
      case 'secure':
        return <ShieldCheckIcon className="w-5 h-5 text-red-500" />;
      default:
        return <GlobeAltIcon className="w-5 h-5 text-green-500" />;
    }
  };

  const getTypeBadgeColor = () => {
    switch (roomData.type) {
      case 'public':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'private':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'secure':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  // Tab configuration
  const tabs = [
    {
      id: 'chat',
      name: 'Live Chat',
      icon: '💬',
      component: RoomChat
    },
    {
      id: 'posts',
      name: 'Posts',
      icon: '📄',
      component: RoomPosts
    }
  ];

  // Add Products tab for commercial rooms
  if (roomData.is_commercial) {
    tabs.push({
      id: 'products',
      name: 'Products',
      icon: '🛍️',
      component: RoomProducts
    });
  }

  const renderTabContent = () => {
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    if (!activeTabData) return null;

    const TabComponent = activeTabData.component;
    return (
      <TabComponent 
        room={roomData} 
        user={user}
        isMember={isMember}
        isOwner={isOwner}
      />
    );
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
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Room Image/Icon */}
                <div className="relative">
                  {roomData.image_url ? (
                    <img 
                      src={roomData.image_url} 
                      alt={roomData.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-lg font-bold">
                        {roomData.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Commercial Badge */}
                  {roomData.is_commercial && (
                    <div className="absolute -top-1 -right-1">
                      <span className="inline-flex items-center w-5 h-5 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <ShoppingBagIcon className="w-3 h-3 mx-auto" />
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {roomData.name}
                  </h2>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor()}`}>
                      {getTypeIcon()}
                      <span className="ml-1 capitalize">{roomData.type}</span>
                    </span>
                    
                    <button 
                      onClick={() => setShowMembersModal(true)}
                      className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      title="View room members"
                    >
                      <UsersIcon className="w-4 h-4 mr-1" />
                      <span>{roomData.members_count || roomData.members?.length || 0} members</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Join/Manage Button */}
                {!isOwner && !isMember && (
                  <button
                    onClick={() => {
                      if (roomData.type === 'secure') {
                        setShowJoinForm(true);
                      } else {
                        handleJoinRoom();
                      }
                    }}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <UserPlusIcon className="w-4 h-4 mr-2" />
                    {loading ? 'Joining...' : (roomData.type === 'private' ? 'Request to Join' : 'Join Room')}
                  </button>
                )}

                {isMember && !isOwner && (
                  <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium rounded-lg">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Member
                  </div>
                )}

                {isOwner && (
                  <button className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200">
                    <Cog6ToothIcon className="w-4 h-4 mr-2" />
                    Manage
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Room Description */}
            {roomData.description && (
              <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">
                {roomData.description}
              </p>
            )}
          </div>

          {/* Tab Navigation */}
          <RoomTabs 
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            disabled={!isMember && !isOwner}
          />

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {!isMember && !isOwner ? (
              <div className="p-8 text-center">
                <LockClosedIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {roomData.type === 'private' ? 'Request Access to Join' : 'Join This Room'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {roomData.type === 'private' 
                    ? 'This is a private room. Send a request to the room owner for approval to access posts, chat, and other content.'
                    : 'Join this room to access posts, live chat, and interact with other members.'
                  }
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      if (roomData.type === 'secure') {
                        setShowJoinForm(true);
                      } else {
                        handleJoinRoom();
                      }
                    }}
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <UserPlusIcon className="w-5 h-5 mr-2" />
                    {loading ? (
                      roomData.type === 'private' ? 'Sending Request...' : 'Joining...'
                    ) : (
                      roomData.type === 'private' ? 'Send Join Request' : (
                        roomData.type === 'secure' ? 'Enter Password' : 'Join Room'
                      )
                    )}
                  </button>
                  
                  {roomData.type === 'public' && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ Public room - Instant access
                    </p>
                  )}
                  {roomData.type === 'private' && (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      ⏳ Requires approval from room owner
                    </p>
                  )}
                  {roomData.type === 'secure' && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      🔒 Password protected
                    </p>
                  )}
                </div>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>

          {/* Join Room Form Modal */}
          {showJoinForm && (
            <JoinRoomForm
              room={roomData}
              onJoin={handleJoinRoom}
              onClose={() => setShowJoinForm(false)}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Room Members Modal */}
      <RoomMembersModal
        room={roomData}
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
      />
    </div>
  );
};

export default RoomModal; 