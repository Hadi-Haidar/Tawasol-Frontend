import React, { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ShoppingBagIcon,
  SparklesIcon,
  HeartIcon,
  CurrencyDollarIcon,
  TagIcon,
  EyeIcon,
  HomeIcon,
 
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import StarRating from '../components/common/StarRating';
import OptimizedImage from '../components/common/OptimizedImage';

import ProductDetailModal from '../components/rooms/tabs/ProductDetailModal';
import OrderModal from '../components/rooms/tabs/OrderModal';

import OrdersView from '../components/rooms/tabs/OrdersView';
import CartPage from '../components/cart/CartPage';
import FavoritesPage from '../components/favorites/FavoritesPage';
import { storeApi, cartApi, favoritesApi } from '../services/api';

import websocketService from '../services/websocket';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/common/Avatar';

const StorePage = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  // Available options for filters
  const [categories, setCategories] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCartPage, setShowCartPage] = useState(false);
  const [showFavoritesPage, setShowFavoritesPage] = useState(false);
  const [showOrdersView, setShowOrdersView] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Gradients for product cards (same as room products)
  const gradients = [
    'from-blue-400 to-purple-500',
    'from-green-400 to-blue-500',
    'from-purple-400 to-pink-500',
    'from-yellow-400 to-orange-500',
    'from-red-400 to-pink-500',
    'from-indigo-400 to-purple-500',
    'from-teal-400 to-blue-500',
    'from-orange-400 to-red-500'
  ];

  // Define functions first
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        search: searchTerm,
        sort: sortBy,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        room_id: roomFilter !== 'all' ? roomFilter : undefined,
        price_min: priceRange.min || undefined,
        price_max: priceRange.max || undefined
      };

      const response = await storeApi.getPublicProducts(params);
      
      setProducts(response.data);
      setCurrentPage(response.current_page);
      setTotalPages(response.last_page);
      setTotalProducts(response.total);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortBy, categoryFilter, roomFilter, priceRange.min, priceRange.max]);

  const loadCategories = async () => {
    try {
      const response = await storeApi.getCategories();
      setCategories(['all', ...response]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await storeApi.getRoomsWithPublicProducts();
      setRooms(response);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadRooms();
  }, [loadProducts]);

  // Load products when filters change
  useEffect(() => {
    setCurrentPage(1);
    loadProducts();
  }, [searchTerm, sortBy, categoryFilter, roomFilter, priceRange, loadProducts]);

  // Load products when page changes
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Subscribe to real-time product updates (stock and ratings)
  useEffect(() => {
    // Subscribe to store-wide product updates for all products
    const subscribeToProductUpdates = () => {
      websocketService.subscribeToStoreProducts({
        onStockUpdated: (data) => {
          // Update the product in our local state if it exists
          setProducts(prevProducts => 
            prevProducts.map(product => {
              if (product.id === data.product.id) {
                const updatedProduct = {
                  ...product,
                  stock: data.product.current_stock
                };
                
                return updatedProduct;
              }
              return product;
            })
          );
        },
        onRatingUpdated: (data) => {
          // Update the product's rating and review count in our local state
          setProducts(prevProducts => 
            prevProducts.map(product => {
              if (product.id === data.product.id) {
                const updatedProduct = {
                  ...product,
                  average_rating: data.product.average_rating,
                  reviews_count: data.product.reviews_count
                };
                
                return updatedProduct;
              }
              return product;
            })
          );
        },
        onSubscribed: () => {},
        onError: (error) => {
          console.error('❌ Store page - Error subscribing to product updates:', error);
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

    // Cleanup subscription when component unmounts
    return () => {
      websocketService.unsubscribeFromStoreProducts();
    };
  }, [toast]); // Include toast dependency like in RoomProducts

  const handleLikeProduct = async (productId) => {
    try {
      const response = await favoritesApi.toggleFavorite(productId);
      
      setProducts(prev => prev.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            is_liked: response.is_favorited
          };
        }
        return product;
      }));
      
      if (response.is_favorited) {
        toast.showSuccess('Added to favorites!');
      } else {
        toast.showSuccess('Removed from favorites!');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.showError('Failed to update favorites');
    }
  };

  const handleAddToCart = async (productId, quantity = 1) => {
    try {
      // Check if user is trying to add their own product
      const product = products.find(p => p.id === productId);
      if (product?.room?.owner_id === user?.id) {
        toast.showError("You can't add your own products to cart!");
        return;
      }

      await cartApi.addToCart(productId, quantity);
      toast.showSuccess('Product added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.showError(error.message || 'Failed to add product to cart');
    }
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  const handleBuyNow = (product) => {
    if (product.room?.owner_id === user?.id) {
      toast.showError("You can't buy your own products!");
      return;
    }
    setSelectedProduct({
      ...product,
      fromCart: false
    });
    setShowOrderModal(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
    setCategoryFilter('all');
    setRoomFilter('all');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'name', label: 'Name A-Z' }
  ];

  const priceRangeOptions = [
    { value: 'all', label: 'All Prices' },
    { value: 'under-25', label: 'Under $25' },
    { value: '25-50', label: '$25 - $50' },
    { value: '50-100', label: '$50 - $100' },
    { value: 'over-100', label: 'Over $100' }
  ];

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {pages}
        
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  // Show Cart Page if requested (full page view like in RoomProducts)
  if (showCartPage) {
    return <CartPage onClose={() => setShowCartPage(false)} context="store" />;
  }

  // Show Favorites Page if requested (full page view like in RoomProducts)
  if (showFavoritesPage) {
    return <FavoritesPage onClose={() => setShowFavoritesPage(false)} />;
  }

  // Show Orders View if requested (full page view like in RoomProducts)
  if (showOrdersView) {
    return <OrdersView user={user} onClose={() => setShowOrdersView(false)} isStoreView={true} />;
  }

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Skeleton */}
          <div className="max-w-7xl mx-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="p-5">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Store Icon */}
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <ShoppingBagIcon className="w-8 h-8 text-white" />
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Public Store</h1>
                <p className="text-gray-600 dark:text-gray-400">Discover amazing products from all rooms</p>
                <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <SparklesIcon className="w-4 h-4 mr-1" />
                  <span>{totalProducts} public products available</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Favorites Button */}
              <button
                onClick={() => setShowFavoritesPage(true)}
                className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <HeartIcon className="w-5 h-5 mr-2" />
                Favorites
              </button>

              {/* Cart Button */}
              <button
                onClick={() => setShowCartPage(true)}
                className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <ShoppingBagIcon className="w-5 h-5 mr-2" />
                Cart
              </button>

              {/* My Orders Button */}
              <button
                onClick={() => setShowOrdersView(true)}
                className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                My Orders
              </button>

              {/* Developer Test Button - Only show in development */}

            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Enhanced Search and Filter Section */}
          <div className="space-y-4">
            {/* Main Search Bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* Sort Dropdown */}
              <div className="relative flex-1 sm:flex-none sm:min-w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 pr-10 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2.5 border rounded-lg font-medium transition-all duration-200 ${
                  showFilters
                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
                Filters
              </button>

              {/* Active Filters Count */}
              {(categoryFilter !== 'all' || roomFilter !== 'all' || priceRange.min || priceRange.max) && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium">
                  {[
                    categoryFilter !== 'all' ? 1 : 0,
                    roomFilter !== 'all' ? 1 : 0,
                    priceRange.min || priceRange.max ? 1 : 0
                  ].reduce((a, b) => a + b, 0)} active
                </span>
              )}
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Room
                    </label>
                    <select
                      value={roomFilter}
                      onChange={(e) => setRoomFilter(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Rooms</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Price
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Price
                    </label>
                    <input
                      type="number"
                      placeholder="No limit"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                {(categoryFilter !== 'all' || roomFilter !== 'all' || priceRange.min || priceRange.max) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              {loading ? 'Loading...' : `Showing ${products.length} of ${totalProducts} products`}
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={loadProducts}
                className="mt-2 text-sm text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Products Grid */}
          {products.length === 0 && !loading ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">
                  {searchTerm || categoryFilter !== 'all' || roomFilter !== 'all' || priceRange.min || priceRange.max ? '🔍' : '🛍️'}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {searchTerm || categoryFilter !== 'all' || roomFilter !== 'all' || priceRange.min || priceRange.max 
                  ? 'No products found' 
                  : 'No public products yet'
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
                {searchTerm || categoryFilter !== 'all' || roomFilter !== 'all' || priceRange.min || priceRange.max
                  ? 'Try adjusting your search criteria or filters to find what you\'re looking for.'
                  : 'No public products are available yet. Check back later or explore our rooms to discover amazing products!'
                }
              </p>
              {(searchTerm || categoryFilter !== 'all' || roomFilter !== 'all' || priceRange.min || priceRange.max) && (
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => (
                  <div key={product.id} className="relative">
                    {/* Stock Notification */}
                    {product.stock <= 5 && product.stock > 0 && (
                      <div className="absolute -top-6 -left-2 z-10">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 shadow-lg">
                          Only {product.stock} left
                        </span>
                      </div>
                    )}
                    
                    {product.stock > 5 && (
                      <div className="absolute -top-6 -left-2 z-10">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 shadow-lg">
                          {product.stock} available
                        </span>
                      </div>
                    )}
                    
                    {product.stock === 0 && (
                      <div className="absolute -top-6 -left-2 z-10">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 shadow-lg">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 transform hover:-translate-y-1">
                      {/* Product Image */}
                      <div className="relative aspect-[5/4] w-full h-auto overflow-hidden flex items-center justify-center bg-white dark:bg-white">
                        {product.images && product.images.length > 0 ? (
                          <OptimizedImage
                            src={product.images[0].file_path}
                            alt={product.name}
                            className="aspect-[5/4] w-full h-auto object-cover rounded-lg border border-gray-200 dark:border-gray-700 group-hover:scale-110 transition-transform duration-300"
                            aspectRatio="aspect-[5/4]"
                          />
                        ) : (
                          <div className={`aspect-[5/4] w-full h-auto flex items-center justify-center bg-gradient-to-br ${gradients[index % gradients.length]} rounded-lg border border-gray-200 dark:border-gray-700`}>
                            <div className="text-white text-3xl font-bold opacity-30">
                              {product.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        )}
                        
                        {/* Action Icons - Top Right */}
                        <div className="absolute top-3 right-3 flex space-x-2">
                          {/* Like Button */}
                          <button
                            onClick={() => handleLikeProduct(product.id)}
                            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 shadow-lg"
                          >
                            {product.is_liked ? (
                              <HeartSolidIcon className="w-5 h-5 text-red-500" />
                            ) : (
                              <HeartIcon className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        </div>

                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-800 shadow-lg">
                            <TagIcon className="w-3 h-3 mr-1" />
                            {product.category || 'Uncategorized'}
                          </span>
                        </div>

                        {/* Public Badge */}
                        <div className="absolute bottom-3 right-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shadow-lg">
                            <SparklesIcon className="w-3 h-3 mr-1" />
                            Public
                          </span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-5">
                        <div className="mb-3">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                            {product.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {product.description || 'No description available'}
                          </p>
                        </div>

                        {/* Room and Owner Info */}
                        {product.room && (
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <HomeIcon className="w-4 h-4 mr-1" />
                              <span className="truncate">{product.room.name}</span>
                            </div>
                            {product.room.owner && (
                              <div className="flex items-center space-x-2">
                                <Avatar 
                                  user={product.room.owner}
                                  size="xs"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  by <span className="font-medium">{product.room.owner.name}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Rating */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2">
                            <StarRating 
                              rating={product.average_rating || 0} 
                              size="small" 
                              showNumber={true}
                              totalReviews={product.reviews_count || 0}
                            />
                            {product.average_rating >= 4.5 && product.reviews_count >= 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Top Rated
                              </span>
                            )}
                          </div>
                          {product.reviews_count > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Based on {product.reviews_count} review{product.reviews_count !== 1 ? 's' : ''}
                            </div>
                          )}
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

                          {/* View Product Button */}
                          <button 
                            onClick={() => handleViewProduct(product)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleAddToCart(product.id, 1)}
                            disabled={product.stock === 0 || product.status !== 'active' || product.room?.owner_id === user?.id}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                            title={product.room?.owner_id === user?.id ? "You can't add your own products to cart" : "Add to Cart"}
                          >
                            <ShoppingBagIcon className="w-4 h-4 mr-1" />
                            Add to Cart
                          </button>
                          
                          <button 
                            onClick={() => handleBuyNow(product)}
                            disabled={product.stock === 0 || product.status !== 'active' || product.room?.owner_id === user?.id}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                            title={product.room?.owner_id === user?.id ? "You can't buy your own products" : "Buy Now"}
                          >
                            <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                            Buy Now
                          </button>
                        </div>

                        {/* Additional Actions */}
                        <div className="space-y-2 mt-3">
                          {/* Quick Review Indicator */}
                          {product.reviews_count === 0 && (
                            <div className="text-center">
                              <p className="text-xs text-gray-500">
                                Be the first to review this product!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {renderPagination()}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showProductDetail && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => {
            setShowProductDetail(false);
            setSelectedProduct(null);
          }}
          onOrder={() => {
            setShowProductDetail(false);
            setShowOrderModal(true);
          }}
          onAddToCart={handleAddToCart}
          onLike={handleLikeProduct}
          isOwner={selectedProduct.room?.owner_id === user?.id}
        />
      )}

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

export default StorePage; 