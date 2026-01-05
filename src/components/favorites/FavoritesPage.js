import React, { useState, useEffect } from 'react';
import {
  HeartIcon,
  ShoppingCartIcon,
  EyeIcon,

  ArrowLeftIcon,
  CurrencyDollarIcon,
  TagIcon,
  ShoppingBagIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { favoritesApi, cartApi } from '../../services/api';
import ProductDetailModal from '../rooms/tabs/ProductDetailModal';
import OrderModal from '../rooms/tabs/OrderModal';
import { useToast } from '../../contexts/ToastContext';
import Avatar from '../common/Avatar';

const FavoritesPage = ({ user, onClose }) => {
  const toast = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await favoritesApi.getFavorites();
      setFavorites(response.favorites || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setError('Failed to load favorites. Please try again.');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId, productId) => {
    try {
      await favoritesApi.removeFavorite(favoriteId);
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
      
      // Show success alert
      toast.showSuccess('Removed from favorites!');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.showError(error.message || 'Failed to remove from favorites');
    }
  };

  const handleAddToCart = async (productId, quantity = 1) => {
    try {
      await cartApi.addToCart(productId, quantity);
      
      // Show success alert
      toast.showSuccess('Product added to cart successfully!');} catch (error) {
      console.error('Error adding to cart:', error);
      // Show error alert
      toast.showError(error.message || 'Failed to add product to cart');
    }
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  // Product gradient backgrounds for visual appeal
  const gradients = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-purple-500 to-pink-600',
    'from-indigo-500 to-blue-600',
    'from-teal-500 to-green-600'
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-50">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your favorites...</p>
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
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <HeartSolidIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">My Favorites</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {favorites.length} {favorites.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={loadFavorites}
              className="mt-2 text-sm text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 underline"
            >
              Try again
            </button>
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <HeartIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              No favorites yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Start exploring products and click the heart icon to add them to your favorites list.
            </p>
            <button
              onClick={onClose}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <ShoppingBagIcon className="w-5 h-5 mr-2" />
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite, index) => {
              const product = favorite.product;
              return (
                <div key={favorite.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-lg hover:border-red-300 dark:hover:border-red-600 transition-all duration-300 transform hover:-translate-y-1">
                  {/* Product Image */}
                  <div className={`relative h-48 bg-gradient-to-br ${gradients[index % gradients.length]} overflow-hidden`}>
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/storage/${product.images[0].file_path}`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-white text-3xl font-bold opacity-30">
                          {product.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                    
                    {/* Remove from Favorites Button */}
                    <button
                      onClick={() => removeFavorite(favorite.id, product.id)}
                      className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 shadow-lg"
                    >
                      <HeartSolidIcon className="w-5 h-5 text-red-500" />
                    </button>

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-800 shadow-lg">
                        <TagIcon className="w-3 h-3 mr-1" />
                        {product.category || 'Uncategorized'}
                      </span>
                    </div>

                    {/* Stock Badge */}
                    {product.stock <= 5 && product.stock > 0 && (
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          Only {product.stock} left
                        </span>
                      </div>
                    )}
                    
                    {product.stock > 5 && (
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {product.stock} left
                        </span>
                      </div>
                    )}
                    
                    {product.stock === 0 && (
                      <div className="absolute bottom-3 left-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <div className="mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {product.description || 'No description available'}
                      </p>
                    </div>

                    {/* Seller Info */}
                    {product.room?.owner && (
                      <div className="flex items-center space-x-2 mb-3">
                        <Avatar 
                          user={product.room.owner}
                          size="xs"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          by <span className="font-medium">{product.room.owner.name}</span>
                        </span>
                      </div>
                    )}

                    {/* Rating */}
                    <div className="flex items-center space-x-1 mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          i < Math.floor(product.rating || 0) ? (
                            <StarSolidIcon key={i} className="w-4 h-4 text-yellow-400" />
                          ) : (
                            <StarIcon key={i} className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                          )
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {product.rating || 0}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({product.reviews_count || 0})
                      </span>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1">
                        <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {product.price}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          USD
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewProduct(product)}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleAddToCart(product.id, 1)}
                          disabled={product.stock === 0 || product.status !== 'active'}
                          className="inline-flex items-center px-2 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                          title="Add to Cart"
                        >
                          <ShoppingCartIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Added to Favorites Date */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Added {new Date(favorite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {showProductDetail && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => {
            setShowProductDetail(false);
            setSelectedProduct(null);
          }}
          onBuy={() => {
            setShowProductDetail(false);
            setSelectedProduct({
              ...selectedProduct,
              fromCart: false // Ensure this is treated as a direct order
            });
            setShowOrderModal(true);
          }}
        />
      )}

      {/* Order Modal */}
      {showOrderModal && selectedProduct && (
        <OrderModal
          product={selectedProduct}
          placedFrom="store"
          onClose={() => {
            setShowOrderModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            setShowOrderModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default FavoritesPage; 