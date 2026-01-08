import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import Avatar from '../components/common/Avatar';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  UserPlusIcon,
  UserMinusIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';

const ManageRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(null);

  useEffect(() => {
    fetchRoomData();
  }, [roomId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMemberDropdown && !event.target.closest('.member-dropdown')) {
        setShowMemberDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMemberDropdown]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      
      // Fetch room details
      const roomResponse = await apiService.get(`/rooms/${roomId}`);
      const roomData = roomResponse.room || roomResponse.data;
      
      // Check if user is the owner
      if (roomData.owner_id !== user.id) {
        navigate(`/user/rooms/${roomId}`);
        return;
      }
      
      setRoom(roomData);
      
      // Fetch members and pending requests
      await Promise.all([
        fetchMembers(),
        fetchPendingRequests()
      ]);
      
    } catch (error) {
      console.error('Error fetching room data:', error);
      showNotification('Failed to load room data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await apiService.get(`/rooms/${roomId}/members`);
      setMembers(response.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await apiService.get(`/rooms/${roomId}/pending-requests`);
      setPendingRequests(response.pending_requests || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleApproveMember = async (userId) => {
    try {
      await apiService.post(`/rooms/${roomId}/members/${userId}/approve`);
      showNotification('Member approved successfully');
      fetchPendingRequests();
      fetchMembers();
    } catch (error) {
      showNotification('Failed to approve member', 'error');
    }
  };

  const handleRejectMember = async (userId) => {
    try {
      await apiService.post(`/rooms/${roomId}/members/${userId}/reject`);
      showNotification('Member request rejected');
      fetchPendingRequests();
    } catch (error) {
      showNotification('Failed to reject member', 'error');
    }
  };

  const handleRemoveMember = async (userId, permanent = false) => {
    try {
      await apiService.post(`/rooms/${roomId}/members/${userId}/remove`, {
        permanent
      });
      showNotification(`Member ${permanent ? 'banned permanently' : 'removed'} successfully`);
      setShowRemoveConfirm(false);
      setMemberToRemove(null);
      fetchMembers();
    } catch (error) {
      showNotification(`Failed to ${permanent ? 'ban' : 'remove'} member`, 'error');
    }
  };

  const handlePromoteMember = async (userId) => {
    try {
      await apiService.post(`/rooms/${roomId}/members/${userId}/promote`);
      showNotification('Member promoted to moderator');
      fetchMembers();
    } catch (error) {
      showNotification('Failed to promote member', 'error');
    }
  };

  const handleDemoteMember = async (userId) => {
    try {
      await apiService.post(`/rooms/${roomId}/members/${userId}/demote`);
      showNotification('Moderator demoted to member');
      fetchMembers();
    } catch (error) {
      showNotification('Failed to demote member', 'error');
    }
  };

  const handleDeleteRoom = async () => {
    try {
      await apiService.delete(`/rooms/${roomId}`);
      showNotification('Room deleted successfully');
              navigate('/user/rooms');
    } catch (error) {
      showNotification('Failed to delete room', 'error');
    }
  };

  const openRemoveConfirm = (member) => {
    setMemberToRemove(member);
    setShowRemoveConfirm(true);
    setShowMemberDropdown(null);
  };

  const quickRemoveMember = async (member, permanent = false) => {
    try {
      await apiService.post(`/rooms/${roomId}/members/${member.user_id}/remove`, {
        permanent
      });
      showNotification(`Member ${permanent ? 'banned permanently' : 'removed'} successfully`);
      setShowMemberDropdown(null);
      fetchMembers();
    } catch (error) {
      showNotification(`Failed to ${permanent ? 'ban' : 'remove'} member`, 'error');
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: CogIcon },
    { id: 'members', name: 'Members', icon: UsersIcon },
    { id: 'requests', name: 'Requests', icon: UserPlusIcon, badge: pendingRequests.length }
  ];

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

      {/* Header - Responsive */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          {/* Mobile: Stacked Layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left Section: Back + Room Info */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => navigate(`/user/rooms/${roomId}`)}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-manipulation"
                aria-label="Back to room"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                {/* Room Avatar/Icon */}
                {room.image_url ? (
                  <img 
                    src={room.image_url} 
                    alt={room.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-base sm:text-lg font-bold">
                      {room.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Room Title & Meta - Simplified */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {room.name}
                  </h1>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <span className="capitalize">{room.type}</span>
                    {members.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section: Edit Button */}
            <button
              onClick={() => navigate(`/user/rooms/${roomId}/edit`)}
              className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation flex-shrink-0 min-h-[44px] sm:min-h-0"
            >
              <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base font-medium">Edit Room</span>
            </button>
          </div>

          {/* Tabs - Responsive */}
          <div className="mt-4 sm:mt-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav 
                className="-mb-px flex gap-4 sm:gap-8 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 touch-manipulation ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{tab.name}</span>
                      {tab.badge > 0 && (
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Room Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <UsersIcon className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{members.length}</p>
                    <p className="text-gray-600 dark:text-gray-400">Total Members</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <UserPlusIcon className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{pendingRequests.length}</p>
                    <p className="text-gray-600 dark:text-gray-400">Pending Requests</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <ShieldCheckIcon className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {members.filter(m => m.role === 'moderator').length}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Moderators</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Room Details</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{room.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{room.type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(room.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Commercial</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {room.is_commercial ? 'Yes' : 'No'}
                  </dd>
                </div>
                {room.description && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{room.description}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Once you delete a room, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete Room
              </button>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Room Members</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((member) => (
                <div key={member.user_id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar 
                      user={member.user} 
                      size="md" 
                      className="flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.user?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  {member.user_id !== user.id && (
                    <div className="flex items-center space-x-2">
                      {member.role === 'member' ? (
                        <button
                          onClick={() => handlePromoteMember(member.user_id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                          title="Promote to Moderator"
                        >
                          <ShieldCheckIcon className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDemoteMember(member.user_id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg"
                          title="Demote to Member"
                        >
                          <ShieldExclamationIcon className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Remove Member Dropdown */}
                      <div className="relative member-dropdown">
                        <button
                          onClick={() => setShowMemberDropdown(
                            showMemberDropdown === member.user_id ? null : member.user_id
                          )}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          title="Remove Member"
                        >
                          <UserMinusIcon className="w-4 h-4" />
                        </button>
                        
                        {showMemberDropdown === member.user_id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => quickRemoveMember(member, false)}
                                className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                              >
                                Remove from Room
                              </button>
                              <button
                                onClick={() => quickRemoveMember(member, true)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              >
                                Ban Permanently
                              </button>
                              <hr className="my-1 border-gray-200 dark:border-gray-700" />
                              <button
                                onClick={() => openRemoveConfirm(member)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                More Options...
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Requests</h3>
            </div>
            {pendingRequests.length === 0 ? (
              <div className="p-12 text-center">
                <UserPlusIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No pending requests</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {pendingRequests.map((request) => (
                  <div key={request.user_id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar 
                        user={request.user} 
                        size="md" 
                        className="flex-shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {request.user?.name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Requested to join
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApproveMember(request.user_id)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg"
                        title="Approve Request"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleRejectMember(request.user_id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                        title="Reject Request"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteConfirm(false)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-red-600">Delete Room</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this room? This action cannot be undone and all data will be permanently lost.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRoom}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && memberToRemove && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowRemoveConfirm(false)} />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-red-600">Remove Member</h3>
              </div>
              
              {/* Member Info */}
              <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Avatar 
                  user={memberToRemove.user} 
                  size="md" 
                  className="flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {memberToRemove.user?.name || 'Unknown User'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {memberToRemove.role}
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose how to remove this member from the room:
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleRemoveMember(memberToRemove.user_id, false)}
                  className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200 text-left"
                >
                  <div className="font-medium">Remove from Room</div>
                  <div className="text-sm text-orange-100">Member can rejoin later if invited</div>
                </button>
                
                <button
                  onClick={() => handleRemoveMember(memberToRemove.user_id, true)}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-left"
                >
                  <div className="font-medium">Ban Permanently</div>
                  <div className="text-sm text-red-100">Member cannot rejoin this room</div>
                </button>
                
                <button
                  onClick={() => setShowRemoveConfirm(false)}
                  className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRoomPage; 