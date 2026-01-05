import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  StarIcon,
  HeartIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  TagIcon,
  ArchiveBoxIcon,
  CalendarIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Avatar from '../../common/Avatar';
import StarRating from '../../common/StarRating';
import ProductReviews from '../../products/ProductReviews';
import { useAuth } from '../../../context/AuthContext';
import websocketService from '../../../services/websocket';

const ProductDetailModal = ({ product, onClose, onEdit, onDelete, onBuy }) => {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(product.is_liked || false);
  const [activeTab, setActiveTab] = useState('details');
  const [currentStock, setCurrentStock] = useState(product.stock);
  const [currentRating, setCurrentRating] = useState(product.average_rating || 0);
  const [currentReviewsCount, setCurrentReviewsCount] = useState(product.reviews_count || 0);

  const images = product.images || [];
  const hasImages = images.length > 0;

  // Subscribe to real-time product updates (stock and ratings) for this specific product
  useEffect(() => {
    // Reset values when product changes
    setCurrentStock(product.stock);
    setCurrentRating(product.average_rating || 0);
    setCurrentReviewsCount(product.reviews_count || 0);

    // Subscribe to this product's updates
    const subscribeToProductUpdates = () => {
      websocketService.subscribeToProductStock(product.id, {
        onStockUpdated: (data) => {if (data.product.id === product.id) {
            // Update local stock state
            setCurrentStock(data.product.current_stock);
          }
        },
        onRatingUpdated: (data) => {if (data.product.id === product.id) {
            // Update local rating and review count state
            setCurrentRating(data.product.average_rating);
            setCurrentReviewsCount(data.product.reviews_count);
          }
        },
        onSubscribed: () => {},
        onError: (error) => {
          console.error(`❌ Error subscribing to product ${product.id} updates:`, error);
        }
      });
    };

    // Initialize WebSocket if needed and subscribe
    if (websocketService.isConnectedToSocket()) {
      subscribeToProductUpdates();
    } else {
      // Initialize with user token if not connected
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        websocketService.initialize(token);
        // Subscribe after a short delay to allow connection
        setTimeout(subscribeToProductUpdates, 1000);
      }
    }

    // Cleanup subscription when component unmounts or product changes
    return () => {
      websocketService.unsubscribeFromProductStock(product.id);
    };
  }, [product.id, product.stock, product.average_rating, product.reviews_count]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    // Here you would typically call an API to update the like status
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStockStatus = () => {
    if (currentStock === 0) {
      return { text: 'Out of Stock', color: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200' };
    } else if (currentStock <= 5) {
      return { text: `Only ${currentStock} left`, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200' };
    } else {
      return { text: `${currentStock} in stock`, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200' };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TagIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Product Details
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {product.category || 'Uncategorized'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Product Details
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Reviews ({currentReviewsCount})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'details' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Gallery */}
              <div className="space-y-4">
                {hasImages ? (
                  <>
                    {/* Main Image */}
                    <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                      <img
                        src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${images[currentImageIndex].file_path}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Image Navigation */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-all duration-200"
                          >
                            <ChevronLeftIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-all duration-200"
                          >
                            <ChevronRightIcon className="w-5 h-5" />
                          </button>
                          
                          {/* Image Counter */}
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                            {currentImageIndex + 1} / {images.length}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Thumbnail Gallery */}
                    {images.length > 1 && (
                      <div className="flex space-x-2 overflow-x-auto pb-2">
                        {images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                              index === currentImageIndex 
                                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                          >
                            <img
                              src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${image.file_path}`}
                              alt={`${product.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* Placeholder when no images */
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl font-bold text-white opacity-50">
                          {product.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No images available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Information */}
              <div className="space-y-6">
                {/* Product Name and Category */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                      {product.name}
                    </h1>
                    <button
                      onClick={toggleLike}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      {isLiked ? (
                        <HeartSolidIcon className="w-6 h-6 text-red-500" />
                      ) : (
                        <HeartIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  {product.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      <TagIcon className="w-4 h-4 mr-1" />
                      {product.category}
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <StarRating 
                        rating={currentRating} 
                        size="medium" 
                        showNumber={true}
                        totalReviews={currentReviewsCount}
                      />
                      {currentReviewsCount > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Average rating from {currentReviewsCount} customer{currentReviewsCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    {(currentReviewsCount > 0) && (
                      <button
                        onClick={() => setActiveTab('reviews')}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        Read all reviews →
                      </button>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4">
                  <div className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {product.price}
                    </span>
                    <span className="text-lg text-gray-500 dark:text-gray-400">
                      USD
                    </span>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="flex items-center space-x-3">
                  <ArchiveBoxIcon className="w-5 h-5 text-gray-400" />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                                  {currentStock > 5 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {currentStock} available
                  </span>
                )}
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Description
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Seller Information */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Seller Information
                  </h3>
                  <div className="flex items-center space-x-3">
                    <Avatar 
                      user={product.room?.owner}
                      size="md"
                      showBorder={true}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.room?.owner?.name || 'Room Owner'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Seller
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Meta */}
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Listed on {formatDate(product.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TagIcon className="w-4 h-4" />
                    <span>Product ID: {product.id}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-3">
                    <button
                      onClick={onBuy}
                      disabled={currentStock === 0 || product.status !== 'active'}
                      className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                    >
                      <ShoppingCartIcon className="w-5 h-5 mr-2" />
                      {currentStock === 0 ? 'Out of Stock' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Reviews Tab */
            <div className="max-w-4xl mx-auto">
              <ProductReviews 
                productId={product.id} 
                currentUser={user}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal; 