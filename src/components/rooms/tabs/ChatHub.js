import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  UserIcon,
  ClockIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  TagIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { orderApi } from '../../../services/api';
import OrderChatModal from './OrderChatModal';
import Avatar from '../../common/Avatar';

const ChatHub = ({ user, room = null, onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState('public'); // 'public' or 'room'

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderApi.getOrders();
      
      // Get all orders (both buyer and seller)
      const allOrders = [...(response.buyer_orders || []), ...(response.seller_orders || [])];
      
      // For batch orders, we only show the primary order (first order in batch) for chat
      // This keeps the UI simple while maintaining single chat per batch
      const uniqueOrders = {};
      allOrders.forEach(order => {
        const chatKey = order.batch_id || `single-${order.id}`;
        if (!uniqueOrders[chatKey]) {
          uniqueOrders[chatKey] = order; // Take the first order as primary
        }
      });
      
      const ordersForChat = Object.values(uniqueOrders);

      // Load messages for each order to create individual conversations
      const individualConversations = await Promise.all(
        ordersForChat.map(async (order) => {
          try {
            const messagesResponse = await orderApi.getMessages(order.id);
            const messages = messagesResponse.messages || [];
            const lastMessage = messages[messages.length - 1];
            const isSellerView = order.product?.room?.owner_id === user.id;
            
            // Determine the other participant
            const otherParticipant = isSellerView 
              ? {
                  name: order.buyer?.name || 'Buyer',
                  id: order.buyer_id,
                  avatar: order.buyer?.avatar,
                  role: 'Buyer'
                }
              : {
                  name: order.product?.room?.owner?.name || 'Seller',
                  id: order.product?.room?.owner_id,
                  avatar: order.product?.room?.owner?.avatar,
                  role: 'Seller'
                };

            return {
              id: `${order.id}-${otherParticipant.id}`, // Unique conversation ID
              orderId: order.id,
              order: order,
              messages,
              lastMessage,
              messageCount: messages.length,

              isSellerView,
              otherParticipant,
              product: order.product,
              status: order.status,
              totalPrice: order.total_price,
              quantity: order.quantity,
              createdAt: order.created_at,
              lastActivity: lastMessage ? lastMessage.created_at : order.created_at
            };
          } catch (error) {
            console.error(`Error loading messages for order ${order.id}:`, error);
            return null;
          }
        })
      );

              // Filter out failed loads and sort by last activity
        const validConversations = individualConversations
          .filter(conv => conv !== null)
          .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

        setConversations(validConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessageTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getOrderStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-3 h-3" />;
      case 'accepted':
      case 'delivered':
        return <CheckCircleIcon className="w-3 h-3" />;
      case 'rejected':
      case 'cancelled':
        return <ExclamationCircleIcon className="w-3 h-3" />;
      default:
        return <ClockIcon className="w-3 h-3" />;
    }
  };

  // Filter conversations based on search
  // Filter conversations by tab (public/room) and search term
  const filteredConversations = conversations.filter(conversation => {
    // Filter by tab based on BUYER membership in the product's room
    // If buyer is a member of the product's room, chat goes to Room Chat
    // If buyer is not a member, chat goes to Public Chat
    const isBuyerMemberOfProductRoom = conversation.order?.is_buyer_member_of_room || false;
    
    const matchesTab = activeTab === 'public' 
      ? !isBuyerMemberOfProductRoom  // Public: buyer is NOT a member of product's room
      : isBuyerMemberOfProductRoom;  // Room: buyer IS a member of product's room
    
    if (!matchesTab) return false;
    
    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    
    return (
      conversation.product.name.toLowerCase().includes(searchLower) ||
      conversation.otherParticipant.name.toLowerCase().includes(searchLower) ||
      conversation.orderId.toString().includes(searchLower)
    );
  });

  // Get counts for tabs
  const publicConversationsCount = conversations.filter(conv => {
    const isBuyerMemberOfProductRoom = conv.order?.is_buyer_member_of_room || false;
    return !isBuyerMemberOfProductRoom; // Public: buyer is NOT a member of product's room
  }).length;
  
  const roomConversationsCount = conversations.filter(conv => {
    const isBuyerMemberOfProductRoom = conv.order?.is_buyer_member_of_room || false;
    return isBuyerMemberOfProductRoom; // Room: buyer IS a member of product's room
  }).length;

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {room ? `${room.name} - Order Chat` : 'Order Chat'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredConversations.length} of {conversations.length} conversations
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              ✕
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveTab('public')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'public'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>🌐</span>
                <span>Public Chat</span>
                {publicConversationsCount > 0 && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === 'public'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                  }`}>
                    {publicConversationsCount}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('room')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'room'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>🏠</span>
                <span>Room Chat</span>
                {roomConversationsCount > 0 && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === 'room'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                  }`}>
                    {roomConversationsCount}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'public' ? 'public' : 'room'} conversations by person, product...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 m-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={loadConversations}
            className="mt-2 text-sm text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Individual Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-3"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {searchTerm ? 'No conversations found' : `No ${activeTab} conversations yet`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
                {searchTerm 
                  ? 'Try adjusting your search to find specific conversations.'
                  : activeTab === 'public'
                    ? 'When you have orders for public products with messages, conversations will appear here.'
                    : 'When you have orders for room-specific products with messages, conversations will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setSelectedOrder(conversation.order);
                    setShowChat(true);
                  }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
                >
                  <div className="flex items-start space-x-4">
                    {/* Participant Avatar */}
                    <div className="relative flex-shrink-0">
                      <Avatar 
                        user={conversation.otherParticipant}
                        size="xl"
                        showBorder={true}
                        // showOnlineIndicator={true} // Removed: Online users functionality
                      />

                    </div>

                    {/* Conversation Details */}
                    <div className="flex-1 min-w-0">
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                            {conversation.otherParticipant.name}
                          </h4>
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full">
                            {conversation.otherParticipant.role}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatLastMessageTime(conversation.lastActivity)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product & Order Info */}
                      <div className="mb-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            📦 {conversation.product.name}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            conversation.order?.is_buyer_member_of_room
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {conversation.order?.is_buyer_member_of_room ? '🏠 Room Member Order' : '🌐 Public Store Order'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center space-x-1">
                            <TagIcon className="w-3 h-3" />
                            <span>Order #{conversation.orderId}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <CurrencyDollarIcon className="w-3 h-3" />
                            <span>${conversation.totalPrice}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <ShoppingBagIcon className="w-3 h-3" />
                            <span>Qty: {conversation.quantity}</span>
                          </span>
                        </div>
                      </div>

                      {/* Last Message Preview */}
                      <div className="mb-3">
                        {conversation.lastMessage ? (
                          <div className="flex items-start space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                              {conversation.lastMessage.sender_id === user.id ? 'You:' : `${conversation.otherParticipant.name}:`}
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-1">
                              {conversation.lastMessage.type === 'image' ? (
                                <span className="flex items-center">
                                  📷 {conversation.lastMessage.message ? conversation.lastMessage.message : 'Image'}
                                </span>
                              ) : (
                                conversation.lastMessage.message
                              )}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No messages yet</p>
                        )}
                      </div>

                      {/* Status & Message Count */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(conversation.status)}`}>
                            {getOrderStatusIcon(conversation.status)}
                            <span>{conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1)}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <ChatBubbleLeftRightIcon className="w-3 h-3" />
                          <span>{conversation.messageCount} {conversation.messageCount === 1 ? 'message' : 'messages'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && selectedOrder && (
        <OrderChatModal
          order={selectedOrder}
          currentUser={user}
          isSellerView={selectedOrder.product?.room?.owner_id === user.id}
          onClose={() => {
            setShowChat(false);
            setSelectedOrder(null);
            // Refresh conversations to update last message
            loadConversations();
          }}
        />
      )}
    </div>
  );
};

export default ChatHub; 