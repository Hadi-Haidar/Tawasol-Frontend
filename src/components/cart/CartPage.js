import React, { useState, useEffect } from 'react';
import {
  ShoppingCartIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  HeartIcon,

  ArrowLeftIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { cartApi, favoritesApi } from '../../services/api';
import OrderModal from '../rooms/tabs/OrderModal';
import { useToast } from '../../contexts/ToastContext';

const CartPage = ({ user, onClose, context = 'store' }) => {
  const toast = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState(null);

  // Buy All modal state
  const [showBuyAllModal, setShowBuyAllModal] = useState(false);
  const [buyAllFormData, setBuyAllFormData] = useState({
    phone_number: '',
    address: '',
    city: '',
    delivery_notes: '',
    placed_from: context // Add context to form data
  });
  const [buyAllLoading, setBuyAllLoading] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.getCart();
      setCartItems(response.cart_items || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      setError('Failed to load cart. Please try again.');
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdatingItems(prev => new Set([...prev, cartItemId]));
    try {
      await cartApi.updateCartItem(cartItemId, newQuantity);
      
      // Update local state
      setCartItems(prev => prev.map(item => 
        item.id === cartItemId 
          ? { ...item, quantity: newQuantity, total_price: item.product.price * newQuantity }
          : item
      ));
      
      // Show success alert
      toast.showSuccess('Cart updated successfully!');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.showError(error.message || 'Failed to update quantity');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await cartApi.removeFromCart(cartItemId);
      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
      
      // Show success alert
      toast.showSuccess('Item removed from cart!');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.showError(error.message || 'Failed to remove item from cart');
    }
  };

  const clearCart = async () => {
    if (!window.confirm('⚠️ Are you sure you want to clear your cart?')) return;

    try {
      await cartApi.clearCart();
      setCartItems([]);
      
      // Show success alert
      toast.showSuccess('Cart cleared successfully!');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.showError(error.message || 'Failed to clear cart');
    }
  };

  const handleToggleFavorite = async (productId) => {
    try {
      const response = await favoritesApi.toggleFavorite(productId);
      
      setCartItems(prev => prev.map(item => {
        if (item.product.id === productId) {
          return {
            ...item,
            product: {
              ...item.product,
              is_liked: response.is_favorited
            }
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleBuyNow = (product, cartItem) => {
    setSelectedProduct({
      ...product,
      fromCart: true, // Flag to indicate this purchase is from cart
      cartQuantity: cartItem.quantity, // Pass the cart quantity
      available_stock: cartItem.available_stock // Pass available stock info
    });
    setShowOrderModal(true);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleBuyAll = async (e) => {
    e.preventDefault();
    
    if (!buyAllFormData.phone_number || !buyAllFormData.address || !buyAllFormData.city) {
      toast.showError('Please fill in all required fields');
      return;
    }

    setBuyAllLoading(true);
    
    try {
      const response = await cartApi.purchaseAll(buyAllFormData);
      
      // Clear cart and close modal
      setCartItems([]);
      setShowBuyAllModal(false);
      setBuyAllFormData({
        phone_number: '',
        address: '',
        city: '',
        delivery_notes: '',
        placed_from: context
      });
      
      toast.showSuccess(`Successfully placed ${response.total_orders} orders! Total: $${response.total_amount.toFixed(2)}`);
      
    } catch (error) {
      console.error('Error purchasing all items:', error);
      toast.showError(error.message || 'Failed to place orders. Please try again.');
    } finally {
      setBuyAllLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-50">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <ShoppingCartIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Shopping Cart</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
            </div>
            
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={loadCart}
              className="mt-2 text-sm text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 underline"
            >
              Try again
            </button>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCartIcon className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Your cart is empty
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Start shopping to add items to your cart and enjoy great products from our community.
            </p>
            <button
              onClick={onClose}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <ShoppingBagIcon className="w-5 h-5 mr-2" />
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img 
                          src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${item.product.images[0].file_path}`}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                          {item.product.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {item.product.category || 'Uncategorized'}
                          </p>
                          <div className="flex items-center space-x-1 mt-2">
                            <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {item.product.price}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">each</span>
                          </div>
                          
                          {/* Stock warning */}
                          {item.available_stock <= 5 && item.available_stock > 0 && (
                            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                              Only {item.available_stock} available{item.quantity > 1 ? ` (you have ${item.quantity} in cart)` : ''}
                            </p>
                          )}
                          
                          {item.available_stock > 5 && (
                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                              {item.available_stock} available{item.quantity > 1 ? ` (you have ${item.quantity} in cart)` : ''}
                            </p>
                          )}
                          
                          {item.available_stock === 0 && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                              No longer available
                            </p>
                          )}
                          
                          {item.can_purchase && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                              ✓ Ready to purchase
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleToggleFavorite(item.product.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                          >
                            {item.product.is_liked ? (
                              <HeartSolidIcon className="w-5 h-5 text-red-500" />
                            ) : (
                              <HeartIcon className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity:</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                              className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                              <MinusIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                              {updatingItems.has(item.id) ? '...' : item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.available_stock || updatingItems.has(item.id)}
                              className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                              <PlusIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {(item.product.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ${item.product.price} × {item.quantity}
                          </p>
                        </div>
                      </div>

                      {/* Buy Now Button */}
                      <div className="mt-4">
                        <button
                          onClick={() => handleBuyNow(item.product, item)}
                          disabled={!item.can_purchase}
                          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                        >
                          <ShoppingBagIcon className="w-4 h-4 mr-2" />
                          {item.can_purchase ? 'Buy Now' : 'Cannot Purchase'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Order Summary
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <div className="flex items-center space-x-1">
                        <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                        <span className="text-gray-900 dark:text-white">
                          {calculateTotal().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
                  Select individual items above to purchase them one by one, or use the button below to purchase all items at once.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => setShowBuyAllModal(true)}
                    disabled={cartItems.some(item => !item.can_purchase)}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                  >
                    <ShoppingBagIcon className="w-4 h-4 mr-2" />
                    {cartItems.some(item => !item.can_purchase) ? 'Some Items Unavailable' : 'Buy All Items'}
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <ShoppingBagIcon className="w-4 h-4 mr-2" />
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedProduct && (
        <OrderModal
          product={selectedProduct}
          placedFrom={context}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            setShowOrderModal(false);
            setSelectedProduct(null);
            loadCart(); // Refresh cart after order
          }}
        />
      )}

      {/* Buy All Modal */}
      {showBuyAllModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                    <ShoppingBagIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                      Purchase All Items
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {cartItems.length} items • Total: ${calculateTotal().toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBuyAllModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleBuyAll} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={buyAllFormData.phone_number}
                  onChange={(e) => setBuyAllFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="Enter your phone number..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={buyAllFormData.address}
                  onChange={(e) => setBuyAllFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your full address..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={buyAllFormData.city}
                  onChange={(e) => setBuyAllFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter your city..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delivery Notes (Optional)
                </label>
                <textarea
                  name="delivery_notes"
                  value={buyAllFormData.delivery_notes}
                  onChange={(e) => setBuyAllFormData(prev => ({ ...prev, delivery_notes: e.target.value }))}
                  placeholder="Any special delivery instructions..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBuyAllModal(false)}
                  disabled={buyAllLoading}
                  className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 font-medium transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={buyAllLoading}
                  className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {buyAllLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBagIcon className="w-4 h-4" />
                      <span>Place Orders</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage; 