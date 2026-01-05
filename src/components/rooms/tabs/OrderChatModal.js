import React, { useState, useEffect, useRef } from 'react';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  DocumentIcon,
  ClockIcon,
  CheckIcon,
  UserIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  TagIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { orderApi } from '../../../services/api';
import Avatar from '../../common/Avatar';
import ImageModal from '../../common/ImageModal';

const OrderChatModal = ({ order, currentUser, isSellerView, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [chatDeleted, setChatDeleted] = useState(false);
  const [canDeleteChat, setCanDeleteChat] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, [order.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderApi.getMessages(order.id);
      setMessages(response.messages || []);
      setChatDeleted(response.chat_deleted || false);
      setCanDeleteChat(response.can_delete_chat || false);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !selectedImage) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const messageData = {};
      
      if (newMessage.trim()) {
        messageData.message = newMessage.trim();
      }
      
      if (selectedImage) {
        messageData.image = selectedImage;
      }

      const response = await orderApi.sendMessage(order.id, messageData);
      
      setMessages(prev => [...prev, response.order_message]);
      setNewMessage('');
      setSelectedImage(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB');
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Only JPEG, PNG, GIF and WebP images are allowed');
        return;
      }
      
      setSelectedImage(file);
      setError(null);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openImageModal = (imageUrl) => {
    setViewingImage(imageUrl);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setViewingImage(null);
    setImageModalOpen(false);
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const otherParticipant = isSellerView 
    ? { name: order.buyer?.name || 'Buyer', id: order.buyer_id }
    : { name: order.product?.room?.owner?.name || 'Seller', id: order.product?.room?.owner_id };

  const handleDeleteChat = async () => {
    if (!window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await orderApi.deleteChat(order.id);
      setChatDeleted(true);
      setMessages([]);
      
      // Show success message
      alert(response.message);
      
      // If permanently deleted, close the modal
      if (response.permanently_deleted) {
        onClose();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      setError(error.error || 'Failed to delete chat. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <ShoppingBagIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Order Chat
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chat with {otherParticipant.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Delete Chat Button */}
            {canDeleteChat && !chatDeleted && (
              <button
                onClick={handleDeleteChat}
                disabled={deleting}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete Chat"
              >
                {deleting ? (
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                ) : (
                  <TrashIcon className="w-5 h-5" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            {/* Product Image */}
            <div className="flex-shrink-0">
              {order.product.images && order.product.images.length > 0 ? (
                <img
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${order.product.images[0].file_path}`}
                  alt={order.product.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">
                    {order.product.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Order Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {order.product.name}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center">
                  <TagIcon className="w-4 h-4 mr-1" />
                  Order #{order.id}
                </span>
                <span className="flex items-center">
                  <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                  ${order.total_price}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : chatDeleted ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrashIcon className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Chat Deleted
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You have deleted this chat from your view
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBagIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No messages yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Start a conversation about this order
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isOwn = message.sender_id === currentUser.id;
                const sender = isOwn ? currentUser : (message.sender || otherParticipant);
                
                return (
                  <div key={message.id} className={`flex items-end space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <Avatar 
                        user={sender}
                        size="sm"
                      />
                    </div>
                    
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      {/* Sender info for group clarity */}
                      {!isOwn && (
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {sender?.name || otherParticipant.name}
                          </span>
                        </div>
                      )}
                      
                      {/* Message content */}
                      {message.type === 'text' && message.message && (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                      )}
                      
                      {message.type === 'image' && message.file_path && (
                        <div className="space-y-2">
                          <img
                            src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${message.file_path}`}
                            alt="Shared image"
                            className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity duration-200"
                            onClick={() => openImageModal(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${message.file_path}`)}
                          />
                          {message.message && (
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.message}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Timestamp */}
                      <div className={`flex items-center justify-end space-x-1 mt-1 ${
                        isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        <ClockIcon className="w-3 h-3" />
                        <span className="text-xs">
                          {formatMessageTime(message.created_at)}
                        </span>
                        {isOwn && (
                          <CheckIcon className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Selected"
                  className="w-12 h-12 object-cover rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {selectedImage.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(selectedImage.size / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
              <button
                onClick={removeSelectedImage}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Message Input */}
        {!chatDeleted && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  disabled={sending}
                />
              </div>
              
              {/* Image Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach Image"
              >
                <PhotoIcon className="w-5 h-5" />
              </button>
              
              {/* Send Button */}
              <button
                type="submit"
                disabled={(!newMessage.trim() && !selectedImage) || sending}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                title="Send Message"
              >
                {sending ? (
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <PaperAirplaneIcon className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModalOpen}
        imageUrl={viewingImage}
        altText="Shared image"
        onClose={closeImageModal}
        showDownload={true}
        showZoom={true}
      />
    </div>
  );
};

export default OrderChatModal; 