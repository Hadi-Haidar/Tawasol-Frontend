import React, { useState } from 'react';
import {
  XMarkIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  MinusIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { orderApi } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';

const OrderModal = ({ product, onClose, onSuccess, placedFrom = 'store' }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    quantity: product.fromCart && product.cartQuantity ? product.cartQuantity : 1,
    phone_number: '',
    address: '',
    city: '',
    delivery_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleQuantityChange = (change) => {
    // For cart items, use available_stock, for direct orders use product.stock
    const maxStock = product.fromCart && product.available_stock !== undefined ? 
      product.available_stock : 
      product.stock;
      
    const newQuantity = Math.max(1, Math.min(maxStock, formData.quantity + change));
    setFormData(prev => ({
      ...prev,
      quantity: newQuantity
    }));
    
    if (errors.quantity) {
      setErrors(prev => ({
        ...prev,
        quantity: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    } else {
      // Use available_stock for cart items, regular stock for direct orders
      const maxStock = product.fromCart && product.available_stock !== undefined ? 
        product.available_stock : 
        product.stock;
        
      if (formData.quantity > maxStock) {
        newErrors.quantity = `Only ${maxStock} items available`;
      }
    }
    
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (formData.phone_number.length > 20) {
      newErrors.phone_number = 'Phone number must be less than 20 characters';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.length > 255) {
      newErrors.address = 'Address must be less than 255 characters';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    } else if (formData.city.length > 100) {
      newErrors.city = 'City must be less than 100 characters';
    }
    
    if (formData.delivery_notes && formData.delivery_notes.length > 500) {
      newErrors.delivery_notes = 'Delivery notes must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const orderData = {
        product_id: product.id,
        quantity: parseInt(formData.quantity),
        phone_number: formData.phone_number.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        delivery_notes: formData.delivery_notes.trim() || null,
        from_cart: product.fromCart || false,
        placed_from: placedFrom
      };

      const response = await orderApi.createOrder(orderData);
      
      if (response.order) {
        // Show success alert
        toast.showSuccess('Order placed successfully!');
        onSuccess(response.order);
      } else {
        throw new Error('Order created but no data returned');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      
      // Handle specific errors from backend
      if (error.message.includes('Insufficient stock')) {
        setErrors({ submit: `Sorry, only ${product.stock} items are available.` });
      } else if (error.message.includes('not available')) {
        setErrors({ submit: 'This product is no longer available for ordering.' });
      } else if (error.message.includes('validation') || error.message.includes('422')) {
        setErrors({ submit: 'Please check your input and try again.' });
      } else if (error.message.includes('403')) {
        setErrors({ submit: 'You do not have permission to place orders.' });
      } else {
        setErrors({ submit: error.message || 'Failed to place order. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = (product.price * formData.quantity).toFixed(2);

  // Calculate the maximum stock available for this order
  const maxAvailableStock = product.fromCart && product.available_stock !== undefined ? 
    product.available_stock : 
    product.stock;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <ShoppingCartIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Place Order
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Complete your purchase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Order Summary
            </h3>
            
            <div className="flex items-start space-x-4">
              {/* Product Image */}
              <div className="flex-shrink-0">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${product.images[0].file_path}`}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {product.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Product Details */}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {product.name}
                </h4>
                {product.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${product.price}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      each
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {maxAvailableStock} available
                    {product.fromCart && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">
                        (from cart)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quantity Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity *
            </label>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                disabled={formData.quantity <= 1 || loading}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                max={maxAvailableStock}
                className={`w-20 px-3 py-2 border rounded-lg text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.quantity ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              />
              
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                disabled={formData.quantity >= maxAvailableStock || loading}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              
              <div className="flex-1 text-right">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Total: 
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white ml-2">
                  ${totalPrice}
                </span>
              </div>
            </div>
            {errors.quantity && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.quantity}
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Contact Information
            </h3>
            
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <PhoneIcon className="w-4 h-4 mr-2" />
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                maxLength={20}
                className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.phone_number ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your phone number..."
                required
              />
              {errors.phone_number && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.phone_number}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Delivery Information
            </h3>
            
            <div className="space-y-4">
              {/* Address */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPinIcon className="w-4 h-4 mr-2" />
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  maxLength={255}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.address ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your full address..."
                  required
                />
                {errors.address && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {errors.address}
                  </p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <UserIcon className="w-4 h-4 mr-2" />
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  maxLength={100}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.city ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your city..."
                  required
                />
                {errors.city && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {errors.city}
                  </p>
                )}
              </div>

              {/* Delivery Notes */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
                  Delivery Notes
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Optional)</span>
                </label>
                <textarea
                  name="delivery_notes"
                  value={formData.delivery_notes}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${
                    errors.delivery_notes ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Any special delivery instructions..."
                />
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                  {formData.delivery_notes.length}/500 characters
                </div>
                {errors.delivery_notes && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {errors.delivery_notes}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order Total */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TruckIcon className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Order Total
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${totalPrice}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.quantity} × ${product.price}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || maxAvailableStock === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Placing Order...
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="w-4 h-4 mr-2" />
                  Place Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal; 