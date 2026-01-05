import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  UsersIcon,
  PhotoIcon,
  XMarkIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import websocketService from '../../../services/websocket';
import chatApiService from '../../../services/chatApi';
import Avatar from '../../common/Avatar';
import OnlineMembers from '../OnlineMembers';

// 🎯 PERFORMANCE: Memoized Message Component
const MessageBubble = React.memo(({ 
  message, 
  isOwn, 
  showAvatar, 
  userRole, 
  onEdit, 
  onDelete 
}) => {
  const [showActions, setShowActions] = useState(false);

  const formatTime = useMemo(() => {
    return message.created_at ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true }) : 'Now';
  }, [message.created_at]);

  const canInteract = useMemo(() => {
    return isOwn || ['owner', 'moderator'].includes(userRole);
  }, [isOwn, userRole]);

  const handleMouseEnter = useCallback(() => {
    if (canInteract) setShowActions(true);
  }, [canInteract]);

  const handleMouseLeave = useCallback(() => {
    setShowActions(false);
  }, []);

  return (
    <div 
      className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {!isOwn && showAvatar && (
        <Avatar user={message.user} size="sm" className="mr-3 mt-1" />
      )}
      
      <div className={`relative max-w-xs lg:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
        {/* Message Actions */}
        {showActions && canInteract && (
          <div className={`absolute top-0 ${isOwn ? 'left-0 -ml-10' : 'right-0 -mr-10'} flex space-x-1 opacity-75 hover:opacity-100`}>
            {isOwn && (
              <>
                <button
                  onClick={() => onEdit(message)}
                  className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  title="Edit"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-1 rounded-full bg-red-200 dark:bg-red-700 hover:bg-red-300 dark:hover:bg-red-600 transition-colors"
                  title="Delete"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}

        {/* Message Content */}
        <div className={`px-4 py-2 rounded-2xl shadow-sm ${
          isOwn 
            ? 'bg-blue-500 text-white' 
            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
        }`}>
          {!isOwn && !showAvatar && (
            <div className="text-xs font-medium mb-1 opacity-75">
              {message.user?.name || 'Unknown User'}
            </div>
          )}
          
          {/* Text Message */}
          {message.type === 'text' && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.message}
            </p>
          )}
          
          {/* Image Message */}
          {message.type === 'image' && (
            <div className="space-y-2">
              {message.message && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.message}
                </p>
              )}
              <img 
                src={message.file_url} 
                alt="Shared image"
                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                loading="lazy"
                onClick={() => window.open(message.file_url, '_blank')}
              />
            </div>
          )}
          
          {/* File Message */}
          {message.type === 'document' && (
            <div className="flex items-center space-x-2">
              <PhotoIcon className="w-5 h-5 opacity-75" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {message.file_name || 'Document'}
                </p>
                <a 
                  href={message.file_url} 
                  download
                  className="text-xs underline opacity-75 hover:opacity-100"
                >
                  Download
                </a>
              </div>
            </div>
          )}
          
          {/* Voice Message */}
          {message.type === 'voice' && (
            <div className="flex items-center space-x-2">
              <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-l-[6px] border-t-[4px] border-b-[4px] border-t-transparent border-b-transparent ml-0.5 border-l-current"></div>
              </button>
              <div className="flex-1">
                <audio src={message.file_url} controls className="w-full h-8" />
              </div>
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
          isOwn ? 'text-right' : 'text-left'
        }`}>
          {formatTime}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

// 🎯 PERFORMANCE: Memoized Typing Indicator
const TypingIndicator = React.memo(({ typingUsers }) => {
  if (!typingUsers.length) return null;

  return (
    <div className="flex items-center space-x-2 mb-3 px-4">
      <div className="flex -space-x-1">
        {typingUsers.slice(0, 2).map((user) => (
          <Avatar 
            key={user.id}
            user={user}
            size="xs"
            className="border-2 border-white dark:border-gray-800"
          />
        ))}
      </div>
      <div className="bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {typingUsers.length === 1 
              ? `${typingUsers[0].name} is typing`
              : `${typingUsers.length} people are typing`
            }
          </span>
          <div className="flex space-x-0.5">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

// 🚀 PERFORMANCE: Main Optimized Chat Component
const RoomChatOptimized = React.memo(({ room, user, isMember, isOwner, userRole = 'member' }) => {
  // 📊 PERFORMANCE: Optimized state management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');

  // 📱 PERFORMANCE: Optimized refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 🔄 PERFORMANCE: Memoized message processing
  const processedMessages = useMemo(() => {
    if (!messages.length) return [];

    return messages.map((message, index) => {
      const prevMessage = messages[index - 1];
      const isOwn = message.user_id === user?.id;
      const showAvatar = !isOwn && (!prevMessage || prevMessage.user_id !== message.user_id);
      
      return {
        ...message,
        isOwn,
        showAvatar
      };
    });
  }, [messages, user?.id]);

  // 📦 PERFORMANCE: Message loading with caching
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simple cache check
      const cacheKey = `messages_room_${room.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 30000) { // 30 seconds cache
          setMessages(data);
          setLoading(false);
          return;
        }
      }

      const response = await chatApiService.getMessages(room.id);
      setMessages(response.messages || []);
      
      // Cache the data
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: response.messages || [],
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [room.id]);

  // 🚀 PERFORMANCE: Optimized scroll management
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  }, []);

  // 📨 PERFORMANCE: Optimized message sending
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage && !selectedFile) return;

    try {
      const messageData = {
        message: trimmedMessage,
        type: selectedFile ? 'image' : 'text'
      };

      if (selectedFile) {
        messageData.file = selectedFile;
      }

      setIsUploading(true);
      const response = await chatApiService.sendMessage(room.id, messageData);
      
      // Add message optimistically
      const optimisticMessage = {
        id: Date.now(), // Temporary ID
        message: trimmedMessage,
        user_id: user.id,
        user: user,
        created_at: new Date().toISOString(),
        type: messageData.type,
        ...response
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      setSelectedFile(null);
      
      // Clear cache
      const cacheKey = `messages_room_${room.id}`;
      sessionStorage.removeItem(cacheKey);
      
      // Auto-scroll for own messages
      setTimeout(() => scrollToBottom(), 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsUploading(false);
    }
  }, [newMessage, selectedFile, room.id, user, scrollToBottom]);

  // ⌨️ PERFORMANCE: Optimized typing indicator
  const handleTypingIndicator = useCallback((value) => {
    if (!websocketService.isConnectedToSocket()) return;

    // Send typing indicator
    websocketService.sendTypingIndicator(room.id, value.length > 0);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        websocketService.sendTypingIndicator(room.id, false);
      }, 2000);
    }
  }, [room.id]);

 
  useEffect(() => {
    if (!websocketService.isConnectedToSocket()) {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        websocketService.initialize(token);
      }
    }

    const channel = websocketService.joinRoom(room.id, {
      onMessage: (data) => {
        setMessages(prev => [...prev, data.message]);
        const cacheKey = `messages_room_${room.id}`;
        sessionStorage.removeItem(cacheKey);
      },
      onTyping: (data) => {
        if (data.user_id !== user?.id) {
          setTypingUsers(prev => {
            const filtered = prev.filter(u => u.id !== data.user_id);
            return data.is_typing ? [...filtered, data.user] : filtered;
          });
        }
      }
    });

    return () => {
      websocketService.leaveRoom(room.id);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [room.id, user?.id]);

  // 📱 PERFORMANCE: Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // 🔄 PERFORMANCE: Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(false);
    }
  }, [messages.length, scrollToBottom]);

  // 📝 PERFORMANCE: Edit message handlers
  const startEditMessage = useCallback((message) => {
    setEditingMessageId(message.id);
    setEditMessageText(message.message || '');
  }, []);

  const saveEditMessage = useCallback(async () => {
    if (!editMessageText.trim() || !editingMessageId) return;

    try {
      await chatApiService.editMessage(editingMessageId, editMessageText.trim());
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === editingMessageId 
            ? { ...msg, message: editMessageText.trim(), updated_at: new Date().toISOString() }
            : msg
        )
      );
      
      setEditingMessageId(null);
      setEditMessageText('');
      
      // Clear cache
      const cacheKey = `messages_room_${room.id}`;
      sessionStorage.removeItem(cacheKey);
      
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  }, [editMessageText, editingMessageId, room.id]);

  const deleteMessage = useCallback(async (messageId) => {
    try {
      await chatApiService.deleteMessage(messageId);
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // Clear cache
      const cacheKey = `messages_room_${room.id}`;
      sessionStorage.removeItem(cacheKey);
      
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }, [room.id]);

  // 📁 PERFORMANCE: File handling
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) { // 10MB limit
      setSelectedFile(file);
    } else {
      alert('File size must be less than 10MB');
    }
  }, []);

  if (!isMember && !isOwner) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Join to Chat
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be a member to participate in this chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-1"
        >
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {processedMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.isOwn}
                  showAvatar={message.showAvatar}
                  userRole={userRole}
                  onEdit={startEditMessage}
                  onDelete={deleteMessage}
                />
              ))}
              
              <TypingIndicator typingUsers={typingUsers} />
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {selectedFile && (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {selectedFile.name}
              </span>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-500 hover:text-red-500"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTypingIndicator(e.target.value);
                }}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <PaperClipIcon className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedFile) || isUploading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <PaperAirplaneIcon className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
            <UsersIcon className="w-4 h-4 mr-2" />
            Online Members
          </h4>
        </div>
        <OnlineMembers room={room} user={user} />
      </div>
    </div>
  );
});

RoomChatOptimized.displayName = 'RoomChatOptimized';

export default RoomChatOptimized; 