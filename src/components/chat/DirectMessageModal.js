import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../common/Avatar';
import Toast from '../common/Toast';
import ImageLightbox from '../common/ImageLightbox';
// Note: Using room-specific API calls instead of global directMessageApi service
import websocketService from '../../services/websocket';
import MessageBubble from './MessageBubble';



const DirectMessageModal = ({ targetUser, currentUser, room, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const conversationIdRef = useRef(null); // Ref to track conversation ID for WebSocket callbacks
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info', isVisible: false });

  // Message interaction states
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  // Image upload states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Image lightbox states
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Show toast notification
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, isVisible: true });
  }, []);

  // Hide toast notification
  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Mark messages as read

  // Start editing a message
  const startEditMessage = useCallback((message) => {
    setEditingMessageId(message.id);
    setEditingText(message.message);
  }, []);

  // Cancel editing
  const cancelEditMessage = useCallback(() => {
    setEditingMessageId(null);
    setEditingText('');
  }, []);

  // Save edited message
  const saveEditMessage = useCallback(async () => {
    if (!editingText.trim() || !editingMessageId) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/rooms/${room.id}/direct-messages/edit/${editingMessageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: editingText
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit message');
      }

      const data = await response.json();

      // Update the message in local state
      setMessages(prev => prev.map(msg =>
        msg.id === editingMessageId
          ? { ...msg, message: editingText, updated_at: new Date().toISOString() }
          : msg
      ));

      setEditingMessageId(null);
      setEditingText('');
      showToast('Message updated successfully', 'success');

    } catch (error) {
      console.error('Failed to edit message:', error);
      showToast('Failed to edit message. Please try again.', 'error');
    }
  }, [editingText, editingMessageId, room?.id, showToast]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId) => {
    if (!messageId) return;

    setDeletingMessageId(messageId);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/rooms/${room.id}/direct-messages/delete/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete message');
      }

      // Remove the message from local state immediately
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      showToast('Message deleted successfully', 'success');

    } catch (error) {
      console.error('Failed to delete message:', error);
      showToast('Failed to delete message. Please try again.', 'error');
    } finally {
      setDeletingMessageId(null);
    }
  }, [room?.id, showToast]);

  // Show delete confirmation modal
  const showDeleteConfirmation = useCallback((messageId) => {
    setMessageToDelete(messageId);
    setShowDeleteConfirm(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(() => {
    if (messageToDelete) {
      deleteMessage(messageToDelete);
    }
    setShowDeleteConfirm(false);
    setMessageToDelete(null);
  }, [messageToDelete, deleteMessage]);

  // Handle delete cancel
  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
    setMessageToDelete(null);
  }, []);

  // Handle keyboard shortcuts for delete confirmation
  useEffect(() => {
    if (showDeleteConfirm) {
      const handleKeyPress = (e) => {
        if (e.key === 'Escape') {
          handleDeleteCancel();
        } else if (e.key === 'Enter') {
          handleDeleteConfirm();
        }
      };

      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [showDeleteConfirm, handleDeleteCancel, handleDeleteConfirm]);

  // Handle typing indicator with debouncing
  const handleTypingIndicator = useCallback((value) => {
    if (!targetUser?.id || !isConnected) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      const now = Date.now();
      const lastSent = typingTimeoutRef.lastSent || 0;

      // Only send typing indicator every 2 seconds max
      if (now - lastSent > 2000) {
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/rooms/${room.id}/direct-messages/typing/${targetUser.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_typing: true }),
        }).catch(error => console.error('Failed to send typing indicator:', error));
        typingTimeoutRef.lastSent = now;
      }

      // Auto-stop after 4 seconds
      typingTimeoutRef.current = setTimeout(() => {
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/rooms/${room.id}/direct-messages/typing/${targetUser.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_typing: false }),
        }).catch(error => console.error('Failed to stop typing indicator:', error));
        typingTimeoutRef.lastSent = 0;
      }, 4000);
    } else {
      if (typingTimeoutRef.lastSent > 0) {
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/rooms/${room.id}/direct-messages/typing/${targetUser.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_typing: false }),
        }).catch(error => console.error('Failed to stop typing indicator:', error));
        typingTimeoutRef.lastSent = 0;
      }
    }
  }, [targetUser?.id, room?.id, isConnected]);

  // Initialize direct message conversation
  const initializeDirectMessage = useCallback(async () => {
    if (!targetUser?.id || !currentUser?.id || !room?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get conversation with target user in this room
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/rooms/${room.id}/direct-messages/conversations/${targetUser.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }

      const data = await response.json();
      // Ensure all messages have proper read status when initially loaded
      const messagesWithReadStatus = (data.messages || []).map(msg => ({
        ...msg,
        is_read: msg.is_read || false // Ensure read status is properly set
      }));
      setMessages(messagesWithReadStatus);
      setConversationId(data.conversation_id);
      conversationIdRef.current = data.conversation_id;

      setIsConnected(true);
      setTimeout(scrollToBottom, 200);

      // Show success toast for new conversations
      if (response.messages && response.messages.length === 0) {
        showToast(`Direct message conversation with ${targetUser.name} started!`, 'success');
      }

    } catch (error) {
      console.error('Failed to initialize direct message:', error);
      setError('Failed to load conversation. Please try again.');
      showToast('Failed to load conversation. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [targetUser?.id, currentUser?.id, room?.id, scrollToBottom, showToast]);

  // WebSocket Subscription Effect - Handled separately from data loading
  useEffect(() => {
    if (!currentUser?.id || !targetUser?.id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize Echo
    websocketService.initialize(token);
    const echo = websocketService.getEcho();
    if (!echo) return;

    const channelName = `user.${currentUser.id}`;
    // Using 'private' gets the channel. If it exists, it reuses it (important for sharing with RoomDirectMessages)
    const userChannel = echo.private(channelName);

    // Handler: Message Sent
    const handleMessageSent = (event) => {
      console.log('[DM] New message event received:', event);
      if (event?.message && event.conversation_id === conversationIdRef.current) {
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === event.message.id);
          if (!exists) {
            const messageWithReadStatus = {
              ...event.message,
              is_read: event.message.sender_id !== currentUser.id ? false : event.message.is_read || false
            };
            return [messageWithReadStatus, ...prev];
          }
          // Update existing message (e.g. valid edit that came as sent?)
          return prev.map(msg => msg.id === event.message.id ? { ...msg, ...event.message } : msg);
        });

        setTimeout(scrollToBottom, 100);
      }
    };

    // Handler: Message Edited
    const handleMessageEdited = (event) => {
      if (event?.message && event.conversation_id === conversationIdRef.current) {
        setMessages(prev => prev.map(msg => msg.id === event.message.id ? event.message : msg));
      }
    };

    // Handler: Message Deleted
    const handleMessageDeleted = (event) => {
      if (event?.message_id && event.conversation_id === conversationIdRef.current) {
        setMessages(prev => prev.filter(msg => msg.id !== event.message_id));
      }
    };

    // Handler: Typing
    const handleTyping = (event) => {
      if (event?.conversation_id === conversationIdRef.current && event.sender.id !== currentUser.id) {
        setTypingUsers(prev => {
          if (event.is_typing) {
            return prev.some(u => u.id === event.sender.id) ? prev : [...prev, event.sender];
          } else {
            return prev.filter(u => u.id !== event.sender.id);
          }
        });
        if (event.is_typing) {
          setTimeout(() => setTypingUsers(prev => prev.filter(u => u.id !== event.sender.id)), 6000);
        }
      }
    };

    // Handler: Read
    const handleRead = (event) => {
      console.log('[DM] Read event received:', event);
      if (event?.conversation_id === conversationIdRef.current) {
        if (event.receiver_id === targetUser.id && event.sender_id === currentUser.id) {
          setMessages(prev => prev.map(msg =>
            (msg.sender_id === currentUser.id && msg.receiver_id === targetUser.id && !msg.is_read)
              ? { ...msg, is_read: true } : msg
          ));
        }
      }
    };

    // Subscribe
    userChannel.listen('.direct.message.sent', handleMessageSent);
    userChannel.listen('.direct.message.edited', handleMessageEdited);
    userChannel.listen('.direct.message.deleted', handleMessageDeleted);
    userChannel.listen('.direct.message.typing', handleTyping);
    userChannel.listen('.direct.message.read', handleRead);

    // Cleanup: Remove specific listeners using stopListening
    return () => {
      // Note: We use stopListening(event, handler) to remove ONLY our handlers
      // This preserves listeners from other components (RoomDirectMessages) on the same channel
      if (userChannel) {
        userChannel.stopListening('.direct.message.sent', handleMessageSent);
        userChannel.stopListening('.direct.message.edited', handleMessageEdited);
        userChannel.stopListening('.direct.message.deleted', handleMessageDeleted);
        userChannel.stopListening('.direct.message.typing', handleTyping);
        userChannel.stopListening('.direct.message.read', handleRead);
      }
    };

  }, [currentUser?.id, targetUser?.id, scrollToBottom]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || sending || !targetUser?.id) return;

    try {
      setSending(true);
      setError(null);

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingTimeoutRef.lastSent > 0) {
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/rooms/${room.id}/direct-messages/typing/${targetUser.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_typing: false }),
        }).catch(console.error);
        typingTimeoutRef.lastSent = 0;
      }

      // Prepare form data for potential file upload
      const formData = new FormData();
      formData.append('message', newMessage || '');
      formData.append('type', selectedImage ? 'image' : 'text');

      if (selectedImage) {
        formData.append('file', selectedImage);
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/rooms/${room.id}/direct-messages/send/${targetUser.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const responseData = await response.json();

      // Optimistic update: Add the message immediately to sender's interface
      if (responseData.message) {
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === responseData.message.id);
          if (!exists) {
            // New sent messages start as unread (will show single check mark)
            const messageWithReadStatus = {
              ...responseData.message,
              is_read: false // Sent messages start as unread until recipient reads them
            };
            return [messageWithReadStatus, ...prev];
          }
          return prev;
        });
        setTimeout(scrollToBottom, 100);
      }

      setNewMessage('');
      clearSelectedImage();
      setTimeout(() => inputRef.current?.focus(), 100);

    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
      showToast('Failed to send message. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  // Function to mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!targetUser?.id || !room?.id) return;

    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/rooms/${room.id}/direct-messages/conversations/${targetUser.id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [targetUser?.id, room?.id]);

  // Enhanced close handler to ensure messages are marked as read
  const handleClose = useCallback(() => {
    markMessagesAsRead();
    onClose();
  }, [markMessagesAsRead, onClose]);

  // Handle image selection
  const handleImageSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        showToast('Image size must be less than 10MB', 'error');
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, [showToast]);

  // Clear selected image
  const clearSelectedImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Open file selector
  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Lightbox functions
  const openLightbox = useCallback((imageUrl, imageAlt = "Image message") => {
    setLightboxImage({ url: imageUrl, alt: imageAlt });
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setLightboxImage(null);
  }, []);

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen && targetUser?.id) {
      // Clear any previous state
      setMessages([]);
      setEditingMessageId(null);
      setEditingText('');
      setDeletingMessageId(null);
      setShowDeleteConfirm(false);
      setMessageToDelete(null);
      setError(null);
      clearSelectedImage();

      initializeDirectMessage();

      // Focus input after a delay
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (targetUser?.id && room?.id && typingTimeoutRef.lastSent > 0) {
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/rooms/${room.id}/direct-messages/typing/${targetUser.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_typing: false }),
        }).catch(console.error);
      }

      // Mark all messages as read when leaving the chat
      if (targetUser?.id && room?.id) {
        markMessagesAsRead();
      }

      if (currentUser?.id) {
        // Do NOT unsubscribe here with echo.leave() as it kills the channel for RoomDirectMessages
        // The new useEffect handles specific listener cleanup via stopListening
      }
      // Clean up all state
      setTypingUsers([]);
      setIsConnected(false);
      setEditingMessageId(null);
      setEditingText('');
      setDeletingMessageId(null);
      setShowDeleteConfirm(false);
      setMessageToDelete(null);
      setError(null);
      setLightboxOpen(false);
      setLightboxImage(null);
    };
  }, [isOpen, targetUser?.id, initializeDirectMessage, currentUser?.id, markMessagesAsRead, clearSelectedImage]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Mark messages as read when user is viewing the chat and there are unread messages from target user
  useEffect(() => {
    if (isOpen && messages.length > 0 && targetUser?.id && room?.id) {
      // Check if there are any unread messages FROM the target user (not from current user)
      const hasUnreadFromTargetUser = messages.some(
        msg => msg.sender_id === targetUser.id && msg.receiver_id === currentUser?.id && !msg.is_read
      );

      if (hasUnreadFromTargetUser) {
        // Debounce the read call to avoid spamming
        const readTimeout = setTimeout(() => {
          markMessagesAsRead();
          console.log('[DM] Marked messages as read');
        }, 500);

        return () => clearTimeout(readTimeout);
      }
    }
  }, [isOpen, messages, targetUser?.id, currentUser?.id, room?.id, markMessagesAsRead]);

  if (!isOpen || !targetUser) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/50 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Close chat"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <Avatar user={targetUser} size="md" showBorder={true} />

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {targetUser.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {targetUser.last_seen ? (
                  `Active ${formatDistanceToNow(new Date(targetUser.last_seen), { addSuffix: true })}`
                ) : (
                  'Direct Message'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-600 rounded-lg transition-colors"
            title="Close"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading conversation...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6">
                <InformationCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
                <button
                  onClick={initializeDirectMessage}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Avatar user={targetUser} size="xl" showBorder={true} className="mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Start a conversation with {targetUser.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Send a message to begin your private conversation.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              {messages.slice().reverse().map((message) => {
                const isOwn = message.sender_id === currentUser?.id;
                const isEditing = editingMessageId === message.id;
                const isDeleting = deletingMessageId === message.id;

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    currentUser={currentUser}
                    targetUser={targetUser}
                    isOwn={isOwn}
                    isEditing={isEditing}
                    isDeleting={isDeleting}
                    editingText={editingText}
                    setEditingText={setEditingText}
                    onStartEdit={startEditMessage}
                    onSaveEdit={saveEditMessage}
                    onCancelEdit={cancelEditMessage}
                    onDelete={showDeleteConfirmation}
                    onImageClick={openLightbox}
                  />
                );
              })}

              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                    {/* Show avatar of the person who is typing */}
                    <div className="flex-shrink-0 mb-1">
                      <Avatar
                        user={typingUsers[0]}
                        size="sm"
                        showBorder={true}
                      />
                    </div>
                    <div>
                      {/* Typing user name */}
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {typingUsers[0]?.name} is typing...
                      </div>
                      {/* Typing animation */}
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        {!loading && !error && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-xl">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={clearSelectedImage}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-20 transition-all duration-200">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewMessage(value);

                      // Auto-resize
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';

                      // Handle typing indicator
                      handleTypingIndicator(value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={`Message ${targetUser.name}...`}
                    className="w-full px-4 py-3 pr-12 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-0 resize-none focus:outline-none focus:ring-0"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '100px', lineHeight: '1.5' }}
                    disabled={sending}
                  />

                  <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={openFileSelector}
                      className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                      disabled={sending}
                      title="Attach image"
                    >
                      <PaperClipIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                      disabled={sending}
                      title="Add emoji"
                    >
                      <FaceSmileIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={(!newMessage.trim() && !selectedImage) || sending}
                className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:scale-100"
                title="Send message"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <PaperAirplaneIcon className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              Delete Message
            </h3>

            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingMessageId === messageToDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed"
              >
                {deletingMessageId === messageToDelete ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        imageUrl={lightboxImage?.url}
        imageAlt={lightboxImage?.alt}
        onClose={closeLightbox}
      />
    </div>
  );
};

export default DirectMessageModal; 