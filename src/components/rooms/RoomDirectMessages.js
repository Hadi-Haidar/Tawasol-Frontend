import React, { useState, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  UserIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  UsersIcon,
  TrophyIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../common/Avatar';
import DirectMessageModal from '../chat/DirectMessageModal';
import Toast from '../common/Toast';

// Room-specific direct message API service
const roomDirectMessageApi = {
  async getRoomConversations(roomId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/rooms/${roomId}/direct-messages/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  },

  async getConversation(roomId, userId, limit = 50, offset = 0) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/rooms/${roomId}/direct-messages/conversations/${userId}?limit=${limit}&offset=${offset}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch conversation');
    return response.json();
  },

  async sendMessage(roomId, userId, message, type = 'text', file = null) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('message', message);
    formData.append('type', type);
    
    if (file) {
      formData.append('file', file);
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/rooms/${roomId}/direct-messages/send/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  async getRoomMembers(roomId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/rooms/${roomId}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch room members');
    return response.json();
  }
};

const RoomDirectMessages = ({ room, currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showDirectMessage, setShowDirectMessage] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [activeView, setActiveView] = useState('conversations'); // 'conversations' or 'members'
  const [roomData, setRoomData] = useState(null);

  // Show toast message
  const showToast = (message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Load conversations
  const loadConversations = async () => {
    if (!room?.id) return;
    
    try {
      setLoading(true);
      setError('');
      
      const data = await roomDirectMessageApi.getRoomConversations(room.id);
      setConversations(data.conversations || []);
      
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError('Failed to load conversations. Please try again.');
      showToast('Failed to load conversations. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load room members
  const loadRoomMembers = async () => {
    if (!room?.id) return;
    
    try {
      setMembersLoading(true);
      setError('');
      
      const data = await roomDirectMessageApi.getRoomMembers(room.id);
      if (data.success) {
        setRoomMembers(data.members || []);
        setRoomData(data.room || {});
      }
      
    } catch (error) {
      console.error('Failed to load room members:', error);
      setError('Failed to load room members. Please try again.');
      showToast('Failed to load room members. Please try again.', 'error');
    } finally {
      setMembersLoading(false);
    }
  };

  // Handle real-time direct message updates
  const handleDirectMessageUpdate = (event) => {
    if (!event?.message || event.message.room_id !== room?.id) return;
    
    const message = event.message;
    const isNewConversation = !conversations.some(conv => 
      conv.other_user.id === (message.sender_id === currentUser?.id ? message.receiver_id : message.sender_id)
    );
    
    if (isNewConversation) {
      // Reload conversations to include new conversation
      loadConversations();
    } else {
      // Update existing conversation's last message and unread count
      setConversations(prev => prev.map(conv => {
        const otherUserId = message.sender_id === currentUser?.id ? message.receiver_id : message.sender_id;
        if (conv.other_user.id === otherUserId) {
          return {
            ...conv,
            last_message: message,
            unread_count: message.sender_id !== currentUser?.id ? conv.unread_count + 1 : conv.unread_count,
            updated_at: message.created_at
          };
        }
        return conv;
      }));
    }
  };

  // Handle messages being marked as read
  const handleMessageRead = (event) => {
    if (!event?.sender_id || !event?.receiver_id || event.room_id !== room?.id) return;
    
    // Update conversation unread count when messages are read
    // The sender_id in the event is the original sender of the messages that were marked as read
    setConversations(prev => prev.map(conv => {
      // If the current user is the receiver and this conversation is with the sender,
      // then reset the unread count since messages from this sender were marked as read
      if (event.receiver_id === currentUser?.id && conv.other_user.id === event.sender_id) {
        return {
          ...conv,
          unread_count: 0
        };
      }
      return conv;
    }));
  };

  // Open conversation with existing conversation
  const openConversation = (conversation) => {
    setSelectedConversation({
      ...conversation.other_user,
      roomId: room.id
    });
    setShowDirectMessage(true);
  };

  // Start new conversation with member
  const startConversationWithMember = (member) => {
    // Don't allow messaging yourself
    if (member.user.id === currentUser?.id) {
      showToast('You cannot message yourself', 'warning');
      return;
    }

    setSelectedConversation({
      ...member.user,
      roomId: room.id
    });
    setShowDirectMessage(true);
  };

  // Close conversation modal
  const closeConversation = () => {
    setShowDirectMessage(false);
    setSelectedConversation(null);
    // Reload conversations to update unread counts
    loadConversations();
  };

  // Get member role icon
  const getMemberRoleIcon = (member) => {
    if (member.user.id === roomData?.owner?.id) {
      return <TrophyIcon className="w-3 h-3 text-yellow-500" title="Room Owner" />;
    }
    if (member.role === 'moderator') {
      return <ShieldCheckIcon className="w-3 h-3 text-blue-500" title="Moderator" />;
    }
    return null;
  };

  // Get member status (check if they have any conversation)
  const getMemberConversationInfo = (member) => {
    const conversation = conversations.find(conv => conv.other_user.id === member.user.id);
    return conversation || null;
  };

  // Load data when room changes
  useEffect(() => {
    if (room?.id) {
      loadConversations();
      loadRoomMembers();
    }
  }, [room?.id]);

  // Set up WebSocket listeners for real-time updates
  useEffect(() => {
    if (!room?.id || !currentUser?.id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize WebSocket connection
    const websocketService = require('../../services/websocket').default;
    websocketService.initialize(token);

    // Subscribe to user's private channel for direct messages using Laravel Echo
    const echo = websocketService.getEcho();
    if (echo) {
      const userChannel = echo.private(`user.${currentUser.id}`);
      
      // Listen for direct message events (use dot prefix for custom event names)
      userChannel.listen('.direct.message.sent', handleDirectMessageUpdate);
      
      // Listen for message read events (use dot prefix for custom event names)
      userChannel.listen('.direct.message.read', handleMessageRead);

      return () => {
        // Cleanup WebSocket listeners - Echo handles cleanup automatically when leaving channel
        echo.leave(`user.${currentUser.id}`);
      };
    }
    
    return () => {};
  }, [room?.id, currentUser?.id, conversations]);

  if (!room) return null;

  if (loading && membersLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header skeleton - matches actual header layout */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse">
                <div className="w-5 h-5"></div>
              </div>
              <div>
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48 animate-pulse"></div>
              </div>
            </div>
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"></div>
          </div>

          {/* Tab navigation skeleton */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <div className="flex-1 h-9 bg-gray-300 dark:bg-gray-600 rounded-md animate-pulse"></div>
            <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-500 rounded-md animate-pulse"></div>
          </div>
        </div>

        {/* Content skeleton - matches conversation/member list layout */}
        <div className="p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 border border-gray-100 dark:border-gray-600 rounded-lg animate-pulse">
                <div className="flex items-center space-x-3">
                  {/* Avatar skeleton */}
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    {/* Unread badge skeleton */}
                    {i % 2 === 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                    )}
                  </div>

                  {/* Conversation info skeleton */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
                      </div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                    </div>
                  </div>

                  {/* Online status skeleton */}
                  <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Direct Messages
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                in {room.name} • {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {unreadCount} unread
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={() => {
              loadConversations();
              loadRoomMembers();
            }}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveView('conversations')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeView === 'conversations'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>Your Conversations</span>
            {conversations.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeView === 'conversations'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
              }`}>
                {conversations.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveView('members')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeView === 'members'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            <span>Room Members</span>
            {roomMembers.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeView === 'members'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
              }`}>
                {roomMembers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Error State */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <ExclamationCircleIcon className="w-4 h-4 text-red-400 mr-2" />
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              <button
                onClick={() => {
                  loadConversations();
                  loadRoomMembers();
                }}
                className="ml-auto px-2 py-1 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 text-red-700 dark:text-red-200 rounded text-xs transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Conversations View */}
        {activeView === 'conversations' && (
          <>
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  No conversations yet
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Start chatting with room members privately
                </p>
                <button
                  onClick={() => setActiveView('members')}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                >
                  <UsersIcon className="w-4 h-4" />
                  <span>Browse Members</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.conversation_id}
                    onClick={() => openConversation(conversation)}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors rounded-lg border border-gray-100 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-600"
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar user={conversation.other_user} size="md" showBorder={true} />
                        {conversation.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                          </div>
                        )}
                      </div>

                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {conversation.other_user?.name}
                            </h4>
                            
                            {/* Role badges for conversation participants */}
                            <div className="flex items-center space-x-1">
                              {/* Check if other user is the room owner */}
                              {conversation.other_user?.id === roomData?.owner?.id ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  <TrophyIcon className="w-2.5 h-2.5 mr-0.5" />
                                  Owner
                                </span>
                              ) : (
                                /* Check if other user is a moderator (only if not owner) */
                                roomMembers.find(member => member.user.id === conversation.other_user?.id && member.role === 'moderator') && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    <ShieldCheckIcon className="w-2.5 h-2.5 mr-0.5" />
                                    Moderator
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                          
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center flex-shrink-0 ml-2">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {conversation.last_message?.created_at && formatDistanceToNow(
                              new Date(conversation.last_message.created_at), 
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                        
                        {conversation.last_message && (
                          <div className="flex items-center space-x-2">
                            <UserIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <p className={`text-xs truncate ${
                              conversation.unread_count > 0 
                                ? 'font-medium text-gray-900 dark:text-white' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {conversation.last_message.sender_id === currentUser.id ? 'You: ' : ''}
                              {conversation.last_message.message}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Online Status Indicator */}
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Room Members View */}
        {activeView === 'members' && (
          <>
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mr-3"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading members...</p>
              </div>
            ) : roomMembers.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  No members found
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Unable to load room members at this time
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                                 {/* Room Owner */}
                 {roomData?.owner && (
                   <div
                     onClick={() => startConversationWithMember({ user: roomData.owner, role: 'owner' })}
                     className={`p-4 rounded-lg border transition-colors ${
                       roomData.owner.id === currentUser?.id
                         ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 cursor-not-allowed opacity-75'
                         : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                     }`}
                   >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar user={roomData.owner} size="md" showBorder={true} />
                                                 <div className="absolute -bottom-1 -right-1">
                           <TrophyIcon className="w-4 h-4 text-blue-500 bg-white dark:bg-gray-800 rounded-full p-0.5" />
                         </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {roomData.owner.name}
                            {roomData.owner.id === currentUser?.id && <span className="text-blue-600 dark:text-blue-400"> (You)</span>}
                          </h4>
                                                     <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                             <TrophyIcon className="w-3 h-3 mr-1" />
                             Owner
                           </span>
                        </div>
                        
                        {/* Show conversation info if exists */}
                        {getMemberConversationInfo({ user: roomData.owner }) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Last message: {formatDistanceToNow(
                              new Date(getMemberConversationInfo({ user: roomData.owner }).last_message.created_at),
                              { addSuffix: true }
                            )}
                          </p>
                        )}
                      </div>

                      {/* Chat indicator */}
                      {roomData.owner.id !== currentUser?.id && (
                        <div className="flex-shrink-0">
                          <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-500" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                                 {/* Regular Members */}
                 {roomMembers.filter(member => member.user.id !== roomData?.owner?.id).map((member) => {
                   const conversationInfo = getMemberConversationInfo(member);
                   const isCurrentUser = member.user.id === currentUser?.id;
                  
                  return (
                    <div
                      key={member.user.id}
                      onClick={() => !isCurrentUser && startConversationWithMember(member)}
                      className={`p-4 rounded-lg border transition-colors ${
                        isCurrentUser
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 cursor-not-allowed opacity-75'
                          : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar user={member.user} size="md" showBorder={true} />
                          {conversationInfo?.unread_count > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                              {conversationInfo.unread_count > 9 ? '9+' : conversationInfo.unread_count}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {member.user.name}
                              {isCurrentUser && <span className="text-blue-600 dark:text-blue-400"> (You)</span>}
                            </h4>
                            
                            {/* Role badges */}
                            <div className="flex items-center space-x-1">
                              {member.role === 'moderator' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  <ShieldCheckIcon className="w-3 h-3 mr-1" />
                                  Moderator
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Show conversation info if exists */}
                          {conversationInfo && conversationInfo.last_message && (
                            <div className="flex items-center space-x-2 mt-1">
                              <UserIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <p className={`text-xs truncate ${
                                conversationInfo.unread_count > 0 
                                  ? 'font-medium text-gray-900 dark:text-white' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {conversationInfo.last_message.sender_id === currentUser.id ? 'You: ' : ''}
                                {conversationInfo.last_message.message}
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                • {formatDistanceToNow(new Date(conversationInfo.last_message.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          )}
                          
                          {/* Show "Start conversation" if no messages */}
                          {!conversationInfo && !isCurrentUser && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Click to start a conversation
                            </p>
                          )}
                        </div>

                        {/* Chat indicator and online status */}
                        <div className="flex flex-col items-end space-y-2">
                          {!isCurrentUser && (
                            <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-500" />
                          )}
                          <div className="w-2 h-2 bg-green-400 rounded-full" title="Online"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Direct Message Modal */}
      {showDirectMessage && selectedConversation && (
        <DirectMessageModal
          targetUser={selectedConversation}
          currentUser={currentUser}
          room={room}
          isOpen={showDirectMessage}
          onClose={closeConversation}
        />
      )}

      {/* Toast Notifications */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
};

export default RoomDirectMessages; 