import React, { useState, useEffect } from 'react';
import {
  ShoppingBagIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  PhoneIcon,
  MapPinIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { orderApi } from '../../../services/api';
import OrderChatModal from './OrderChatModal';

const OrdersView = ({ user, room, isOwner, onClose, isStoreView = false }) => {
  const [orders, setOrders] = useState({ buyer_orders: [], seller_orders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('purchases'); // Default to purchases for store view
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderApi.getOrders();
      setOrders(response);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderApi.updateOrderStatus(orderId, newStatus);
      // Refresh orders after status update
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status.');
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await orderApi.cancelOrder(orderId);
      // Refresh orders after cancellation
      loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError('Failed to cancel order.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'accepted':
        return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'delivered':
        return <TruckIcon className="w-5 h-5 text-green-500" />;
      case 'rejected':
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Process orders - convert parent-child structure to display format
  const processOrdersForDisplay = (ordersList) => {
    return ordersList.map(order => {
      // Check if this is a combined order (has child orders)
      if (order.child_orders && order.child_orders.length > 0) {
        // This is a main order with child orders - create combined display
        const allOrders = [order, ...order.child_orders];
        return {
          id: order.id,
          isBatchOrder: true,
          orders: allOrders,
          created_at: order.created_at,
          status: order.status,
          buyer: order.buyer,
          total_price: allOrders.reduce((sum, o) => sum + parseFloat(o.total_price), 0),
          quantity: allOrders.reduce((sum, o) => sum + parseInt(o.quantity), 0),
          // Use main order data for other fields
          product: order.product
        };
      } else {
        // Regular individual order
        return order;
      }
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const currentOrders = processOrdersForDisplay(activeTab === 'purchases' ? orders.buyer_orders : orders.seller_orders);

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <ShoppingBagIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">My Orders</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isStoreView 
                    ? 'Manage all your purchases and sales' 
                    : (isOwner ? 'Manage your sales in this room' : 'Manage your purchases from this room')
                  }
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

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'purchases'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ShoppingBagIcon className="w-4 h-4 mr-2" />
              My Purchases ({orders.buyer_orders.length})
            </button>
            
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'sales'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <TruckIcon className="w-4 h-4 mr-2" />
              My Sales ({orders.seller_orders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 m-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={loadOrders}
            className="mt-2 text-sm text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : currentOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <ShoppingBagIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                No {activeTab === 'purchases' ? 'purchases' : 'sales'} yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
                {activeTab === 'purchases' 
                  ? "You haven't made any purchases yet. Start shopping to see your orders here!"
                  : "You haven't made any sales yet. Your sold items will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentOrders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  {/* Order Header */}
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {order.isBatchOrder ? (
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center relative">
                            <ShoppingBagIcon className="w-8 h-8 text-white" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">{order.orders.length}</span>
                            </div>
                          </div>
                        ) : order.product?.images && order.product.images.length > 0 ? (
                          <img
                            src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${order.product.images[0].file_path}`}
                            alt={order.product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {order.product?.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                              {order.isBatchOrder ? `Combined Order (${order.orders.length} items)` : order.product.name}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {!order.isBatchOrder && (
                                <span className="flex items-center">
                                  <TagIcon className="w-4 h-4 mr-1" />
                                  Order #{order.id}
                                </span>
                              )}
                              <span className="flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                {formatDate(order.created_at)}
                              </span>
                              {order.isBatchOrder && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  Multi-Item
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center text-gray-600 dark:text-gray-400">
                                {order.isBatchOrder ? 'Total Items:' : 'Quantity:'} <span className="font-medium ml-1">{order.quantity}</span>
                              </span>
                              <span className="flex items-center text-green-600">
                                <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                                <span className="font-bold">${order.total_price.toFixed(2)}</span>
                              </span>
                            </div>
                            {order.isBatchOrder && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex flex-wrap gap-1">
                                  {order.orders.slice(0, 3).map((item, index) => (
                                    <span key={item.id} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                      {item.product.name}
                                    </span>
                                  ))}
                                  {order.orders.length > 3 && (
                                    <span className="text-gray-400">+{order.orders.length - 3} more</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Status & Actions */}
                          <div className="flex flex-col items-end space-y-3">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(order.status)}
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  // For batch orders, use the first order for chat
                                  const chatOrder = order.isBatchOrder ? order.orders[0] : order;
                                  setSelectedOrder(chatOrder);
                                  setShowChat(true);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                                title="Open Chat"
                              >
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                                title="View Details"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Buyer/Seller Info */}
                        <div className="mt-3 flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <UserIcon className="w-4 h-4 mr-1" />
                          {activeTab === 'purchases' ? (
                            <span>
                              Seller: <span className="font-medium">
                                {order.isBatchOrder 
                                  ? (order.orders[0]?.product?.room?.owner?.name || 'Unknown')
                                  : (order.product?.room?.owner?.name || 'Unknown')
                                }
                              </span>
                            </span>
                          ) : (
                            <span>
                              Buyer: <span className="font-medium">
                                {order.isBatchOrder 
                                  ? (order.orders[0]?.buyer?.name || 'Unknown')
                                  : (order.buyer?.name || 'Unknown')
                                }
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for Sellers */}
                    {activeTab === 'sales' && order.status === 'pending' && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleStatusUpdate(order.isBatchOrder ? order.orders[0].id : order.id, 'accepted')}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
                          >
                            Accept {order.isBatchOrder ? 'All Items' : 'Order'}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order.isBatchOrder ? order.orders[0].id : order.id, 'rejected')}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
                          >
                            Reject {order.isBatchOrder ? 'All Items' : 'Order'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mark as Delivered Button for Sellers */}
                    {activeTab === 'sales' && order.status === 'accepted' && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => handleStatusUpdate(order.isBatchOrder ? order.orders[0].id : order.id, 'delivered')}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                          Mark as Delivered
                        </button>
                      </div>
                    )}

                    {/* Cancel Button for Buyers */}
                    {activeTab === 'purchases' && order.status === 'pending' && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => handleCancelOrder(order.isBatchOrder ? order.orders[0].id : order.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
                        >
                          Cancel {order.isBatchOrder ? 'All Items' : 'Order'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedOrder === order.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-6">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-4">
                        {order.isBatchOrder ? 'Order Details' : 'Delivery Information'}
                      </h5>
                      
                      {order.isBatchOrder && (
                        <div className="mb-6">
                          <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Items in this order:</h6>
                          <div className="space-y-3">
                            {order.orders.map((item) => (
                              <div key={item.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  {item.product.images && item.product.images.length > 0 ? (
                                    <img
                                      src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${item.product.images[0].file_path}`}
                                      alt={item.product.name}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
                                      <span className="text-sm font-bold">{item.product.name.charAt(0)}</span>
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{item.product.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity} × ${item.product.price}</p>
                                  </div>
                                </div>
                                <span className="font-medium text-green-600">${item.total_price}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start space-x-2">
                          <PhoneIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {order.isBatchOrder ? order.orders[0].phone_number : order.phone_number}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Address:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {order.isBatchOrder ? order.orders[0].address : order.address}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                              {order.isBatchOrder ? order.orders[0].city : order.city}
                            </p>
                          </div>
                        </div>
                        {(order.isBatchOrder ? order.orders[0].delivery_notes : order.delivery_notes) && (
                          <div className="md:col-span-2 flex items-start space-x-2">
                            <ExclamationTriangleIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Delivery Notes:</span>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {order.isBatchOrder ? order.orders[0].delivery_notes : order.delivery_notes}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Chat Modal */}
      {showChat && selectedOrder && (
        <OrderChatModal
          order={selectedOrder}
          currentUser={user}
          isSellerView={activeTab === 'sales'}
          onClose={() => {
            setShowChat(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default OrdersView; 