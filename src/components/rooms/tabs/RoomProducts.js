import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PlusIcon,
  ShoppingCartIcon,
  HeartIcon,
  StarIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  TagIcon,
  UserIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  PencilIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import StarRating from '../../common/StarRating';
import OptimizedImage from '../../common/OptimizedImage';
import AddProductModal from './AddProductModal';
import ProductDetailModal from './ProductDetailModal';
import OrderModal from './OrderModal';
import OrdersView from './OrdersView';
import ChatHub from './ChatHub';
import CartPage from '../../cart/CartPage';
import FavoritesPage from '../../favorites/FavoritesPage';
import VisibilityToggle from '../../store/VisibilityToggle';
import { productApi, cartApi, favoritesApi } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import Avatar from '../../common/Avatar';
import websocketService from '../../../services/websocket';

const RoomProducts = React.memo(({ room, user, isMember, isOwner }) => {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState('all');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showOrdersView, setShowOrdersView] = useState(false);
  const [showChatHub, setShowChatHub] = useState(false);
  const [showCartPage, setShowCartPage] = useState(false);
  const [showFavoritesPage, setShowFavoritesPage] = useState(false);
  const [error, setError] = useState(null);
  const [userCoins, setUserCoins] = useState(user?.coins || 0);
  
  // Owner actions dropdown state
  const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Delete confirmation modal state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchUserCoins = useCallback(async () => {
    try {
      // Using the existing api service to get user balance
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/user/coins/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserCoins(data.data?.current_balance || 0);
      }
    } catch (error) {
      console.error('Error fetching user coins:', error);
      // Fallback to user object coins if API fails
      setUserCoins(user?.coins || 0);
    }
  }, [user?.coins]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 📦 PERFORMANCE: Check session cache first
      const cacheKey = `products_room_${room.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Use cache if less than 2 minutes old
        if (Date.now() - timestamp < 120000) {
          setProducts(data);
          setLoading(false);
          return;
        }
      }

      const response = await productApi.getProducts(room.id);
      setProducts(response.products);
      
      // 📦 PERFORMANCE: Store in session cache
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: response.products,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [room.id]);

  // Load products from API
  useEffect(() => {
    loadProducts();
    fetchUserCoins();
  }, [loadProducts, fetchUserCoins]);

  // Reset sortBy if it's set to 'popular' (removed option)
  useEffect(() => {
    if (sortBy === 'popular') {
      setSortBy('newest');
    }
  }, [sortBy]);

  // Subscribe to real-time product updates (stock and ratings)
  useEffect(() => {
    // Subscribe to store-wide product updates for all products
    const subscribeToProductUpdates = () => {
      websocketService.subscribeToStoreProducts({
        onStockUpdated: (data) => {// Update the product in our local state if it exists
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
        onRatingUpdated: (data) => {// Update the product's rating and review count in our local state
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
          console.error('❌ Error subscribing to product updates:', error);
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
  }, [room.id, toast]);

  const handleLikeProduct = useCallback(async (productId) => {
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
      
      // Clear cache when products change
      const cacheKey = `products_room_${room.id}`;
      sessionStorage.removeItem(cacheKey);
      
      // Show appropriate alert based on action
      if (response.is_favorited) {
        toast.showSuccess('Added to favorites!');
      } else {
        toast.showSuccess('Removed from favorites!');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.showError('Failed to update favorites');
    }
  }, [room.id, toast]);

  const handleAddToCart = useCallback(async (productId, quantity = 1) => {
    try {
      // Prevent room owners from adding their own products to cart
      if (isOwner) {
        toast.showError("You can't add your own products to cart!");
        return;
      }

      await cartApi.addToCart(productId, quantity);
      
      // Show success alert
      toast.showSuccess('Product added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Show error alert
      toast.showError(error.message || 'Failed to add product to cart');
    }
  }, [isOwner, toast]);

  const handleViewProduct = useCallback((product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  }, []);

  const handleProductAdded = useCallback((newProduct) => {
    setProducts(prev => [newProduct, ...prev]);
    setShowAddProduct(false);
    // Clear cache when products change
    const cacheKey = `products_room_${room.id}`;
    sessionStorage.removeItem(cacheKey);
  }, [room.id]);

  const handleProductUpdated = useCallback((updatedProduct) => {
    setProducts(prev => prev.map(product => 
      product.id === updatedProduct.id ? updatedProduct : product
    ));
    // Clear cache when products change
    const cacheKey = `products_room_${room.id}`;
    sessionStorage.removeItem(cacheKey);
  }, [room.id]);

  const handleProductDeleted = useCallback((productId) => {
    setProducts(prev => prev.filter(product => product.id !== productId));
    // Clear cache when products change
    const cacheKey = `products_room_${room.id}`;
    sessionStorage.removeItem(cacheKey);
  }, [room.id]);

  const handleVisibilityChange = useCallback((productId, updatedProduct) => {
    setProducts(prev => prev.map(product => 
      product.id === productId ? updatedProduct : product
    ));
    // Refresh user coins after visibility change
    fetchUserCoins();
    // Clear cache when products change
    const cacheKey = `products_room_${room.id}`;
    sessionStorage.removeItem(cacheKey);
  }, [room.id, fetchUserCoins]);

  const handleDeleteProduct = useCallback(async (productId) => {
    try {
      await productApi.deleteProduct(productId);
      
      // Remove product from local state
      handleProductDeleted(productId);
      
      // Close modal
      setShowProductDetail(false);
      setSelectedProduct(null);
      
      // Show success alert
      toast.showSuccess('Product deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting product:', error);
      // Show error alert
      toast.showError(error.message || 'Failed to delete product');
    }
  }, [handleProductDeleted, toast]);

  // Owner dropdown handlers
  const toggleOwnerDropdown = useCallback((productId, event) => {
    event.stopPropagation();
    setOwnerDropdownOpen(ownerDropdownOpen === productId ? null : productId);
  }, [ownerDropdownOpen]);

  const handleEditProduct = useCallback((product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
    setOwnerDropdownOpen(null);
  }, []);

  const handleDeleteWithConfirmation = useCallback((product) => {
    setProductToDelete(product);
    setShowDeleteConfirmation(true);
    setOwnerDropdownOpen(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (productToDelete) {
      await handleDeleteProduct(productToDelete.id);
      setShowDeleteConfirmation(false);
      setProductToDelete(null);
    }
  }, [productToDelete, handleDeleteProduct]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirmation(false);
    setProductToDelete(null);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOwnerDropdownOpen(null);
    };
    
    if (ownerDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [ownerDropdownOpen]);

  // 🚀 PERFORMANCE: Memoized categories calculation
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(product => product.category || 'Uncategorized'))];
    return ['all', ...uniqueCategories];
  }, [products]);

  // 📊 PERFORMANCE: Memoized filtering and sorting
  const sortedProducts = useMemo(() => {
    if (!products.length) return [];

    // Filter products based on search, category, and price range
    const filteredProducts = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || (product.category || 'Uncategorized') === categoryFilter;
      
      const matchesPriceRange = (() => {
        switch (priceRangeFilter) {
          case 'under-25':
            return product.price < 25;
          case '25-50':
            return product.price >= 25 && product.price <= 50;
          case '50-100':
            return product.price > 50 && product.price <= 100;
          case 'over-100':
            return product.price > 100;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesCategory && matchesPriceRange;
    });

    // Sort products
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });
  }, [products, searchTerm, categoryFilter, priceRangeFilter, sortBy]);

  // Product gradient backgrounds for visual appeal
  const gradients = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-purple-500 to-pink-600',
    'from-indigo-500 to-blue-600',
    'from-teal-500 to-green-600'
  ];

  // Show Cart Page if requested
  if (showCartPage) {
    return <CartPage user={user} onClose={() => setShowCartPage(false)} context="room" />;
  }

  // Show Favorites Page if requested
  if (showFavoritesPage) {
    return <FavoritesPage user={user} onClose={() => setShowFavoritesPage(false)} />;
  }

  // Show Orders View if requested
  if (showOrdersView) {
    return <OrdersView user={user} room={room} isOwner={isOwner} onClose={() => setShowOrdersView(false)} />;
  }

  // Show Chat Hub if requested
  if (showChatHub) {
    return <ChatHub user={user} room={room} onClose={() => setShowChatHub(false)} />;
  }

  if (!room.is_commercial) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl">🛍️</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Not a Commercial Room
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Products are only available in commercial rooms. Upgrade to a commercial room to start selling products.
          </p>
        </div>
      </div>
    );
  }

  if (!isMember && !isOwner) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-3xl">🔒</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Join to View Products
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            You need to be a member to view and purchase products in this room.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Enhanced Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6">
          {/* Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white text-lg font-bold">🛍️</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Products</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                    Commercial
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {products.length} {products.length === 1 ? 'product' : 'products'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 flex-wrap">
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
                <ShoppingCartIcon className="w-5 h-5 mr-2" />
                Cart
              </button>

              {/* Chat Hub Button - Always visible for members */}
              <button
                onClick={() => setShowChatHub(true)}
                className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                Chat
              </button>

              {/* Orders Button */}
              <button
                onClick={() => setShowOrdersView(true)}
                className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <ShoppingBagIcon className="w-5 h-5 mr-2" />
                My Orders
              </button>

              {isOwner && (
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add Product
                </button>
              )}
            </div>
          </div>

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
                  <option value="newest">Newest First</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
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
              {(categoryFilter !== 'all' || priceRangeFilter !== 'all') && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium">
                  {[categoryFilter !== 'all' ? 1 : 0, priceRangeFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)} active
                </span>
              )}
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  {/* Price Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price Range
                    </label>
                    <select
                      value={priceRangeFilter}
                      onChange={(e) => setPriceRangeFilter(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Prices</option>
                      <option value="under-25">Under $25</option>
                      <option value="25-50">$25 - $50</option>
                      <option value="50-100">$50 - $100</option>
                      <option value="over-100">Over $100</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                {(categoryFilter !== 'all' || priceRangeFilter !== 'all') && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => {
                        setCategoryFilter('all');
                        setPriceRangeFilter('all');
                      }}
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 m-6">
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
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="relative">
                  {/* Stock badge skeleton */}
                  <div className="absolute -top-6 -left-2 z-10">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16 animate-pulse"></div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
                    {/* Image skeleton - exact height match */}
                    <div className="relative h-52 overflow-hidden">
                      <div className="w-full h-full bg-gray-300 dark:bg-gray-600"></div>
                      {/* Action buttons skeleton */}
                      <div className="absolute top-3 right-3">
                        <div className="w-10 h-10 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                      </div>
                      {/* Category badge skeleton */}
                      <div className="absolute top-3 left-3">
                        <div className="h-6 bg-gray-400 dark:bg-gray-500 rounded-full w-20"></div>
                      </div>
                    </div>
                    
                    {/* Content skeleton - exact layout match */}
                    <div className="p-4">
                      {/* Title and description */}
                      <div className="mb-2">
                        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                      </div>

                      {/* Rating skeleton */}
                      <div className="mb-3 flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          ))}
                        </div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-8"></div>
                      </div>

                      {/* Price and view button */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-8"></div>
                        </div>
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex space-x-2 mb-3">
                        <div className="flex-1 h-9 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                        <div className="flex-1 h-9 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                      </div>

                      {/* Seller info */}
                      <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">
                  {searchTerm || categoryFilter !== 'all' || priceRangeFilter !== 'all' ? '🔍' : '🛍️'}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {searchTerm || categoryFilter !== 'all' || priceRangeFilter !== 'all' ? 'No products found' : 'No products yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
                {searchTerm || categoryFilter !== 'all' || priceRangeFilter !== 'all'
                  ? 'Try adjusting your search criteria or filters to find what you\'re looking for.'
                  : 'No products have been added to this room yet. Be the first to add some amazing products!'}
              </p>
              {isOwner && !(searchTerm || categoryFilter !== 'all' || priceRangeFilter !== 'all') && (
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add First Product
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProducts.map((product, index) => (
                <div key={product.id} className="relative">
                  {/* Stock Notification - Outside card at top-left */}
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
                        {product.stock} left
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
                    {/* Product Image - Fixed dimensions to prevent CLS */}
                    <div className="relative aspect-[5/4] w-full h-auto overflow-hidden flex items-center justify-center bg-white dark:bg-white">
                      {product.images && product.images.length > 0 ? (
                        <OptimizedImage
                          src={product.images[0].file_path}
                          alt={product.name}
                          className="aspect-[5/4] w-full h-auto object-cover rounded-lg border border-gray-200 dark:border-gray-700 group-hover:scale-105 transition-transform duration-300"
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
                        {/* Owner Actions Dropdown - Only for room owners (who own all products) */}
                        {isOwner ? (
                          <div className="relative">
                            <button
                              onClick={(e) => {toggleOwnerDropdown(product.id, e);
                              }}
                              className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 shadow-lg border-2 border-blue-500"
                              title="Product Actions (Owner)"
                            >
                              <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                            </button>
                            
                            {/* Dropdown Menu */}
                            {ownerDropdownOpen === product.id && (
                              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                                <button
                                  onClick={() => handleEditProduct(product)}
                                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <PencilIcon className="w-4 h-4 mr-3" />
                                  Update Product
                                </button>
                                <button
                                  onClick={() => handleDeleteWithConfirmation(product)}
                                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  <TrashIcon className="w-4 h-4 mr-3" />
                                  Delete Product
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Like Button for non-owners */
                          <button
                            onClick={() => {handleLikeProduct(product.id);
                            }}
                            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 shadow-lg"
                          >
                            {product.is_liked ? (
                              <HeartSolidIcon className="w-5 h-5 text-red-500" />
                            ) : (
                              <HeartIcon className="w-5 h-5 text-gray-600" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-800 shadow-lg">
                          <TagIcon className="w-3 h-3 mr-1" />
                          {product.category || 'Uncategorized'}
                        </span>
                      </div>

                      {/* Owner Badge - Show when user is room owner */}
                      {isOwner && (
                        <div className="absolute bottom-3 right-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 shadow-lg">
                            <UserIcon className="w-3 h-3 mr-1" />
                            Your Product
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <div className="mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                          {product.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 leading-relaxed">
                          {product.description || 'No description available'}
                        </p>
                      </div>

                      {/* Rating */}
                      <div className="mb-3">
                        <StarRating 
                          rating={product.average_rating || 0} 
                          size="small" 
                          showNumber={true}
                          totalReviews={product.reviews_count || 0}
                        />
                      </div>

                      {/* Price and Actions */}
                      <div className="flex items-center justify-between mb-3">
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

                      {/* Visibility Toggle for Room Owners */}
                      {isOwner && (
                        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <VisibilityToggle
                            product={product}
                            onVisibilityChange={handleVisibilityChange}
                            userCoins={userCoins}
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleAddToCart(product.id, 1)}
                          disabled={product.stock === 0 || product.status !== 'active' || isOwner}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                          title={isOwner ? "You can't add your own products to cart" : "Add to Cart"}
                        >
                          <ShoppingCartIcon className="w-4 h-4 mr-1" />
                          Add to Cart
                        </button>
                        
                        <button 
                          onClick={() => {
                            if (isOwner) {
                              toast.showError("You can't buy your own products!");
                              return;
                            }
                            setSelectedProduct({
                              ...product,
                              fromCart: false // Ensure this is treated as a direct order
                            });
                            setShowOrderModal(true);
                          }}
                          disabled={product.stock === 0 || product.status !== 'active' || isOwner}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                          title={isOwner ? "You can't buy your own products" : "Buy Now"}
                        >
                          <ShoppingBagIcon className="w-4 h-4 mr-1" />
                          Buy Now
                        </button>
                      </div>

                      {/* Seller Info */}
                      <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-2">
                          <Avatar 
                            user={product.room?.owner || room.owner}
                            size="xs"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            by <span className="font-medium">{product.room?.owner?.name || room.owner?.name || 'Room Owner'}</span>
                          </span>
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

      {/* Modals */}
      {showAddProduct && (
        <AddProductModal
          room={room}
          onClose={() => setShowAddProduct(false)}
          onSuccess={handleProductAdded}
        />
      )}

      {showEditModal && selectedProduct && (
        <AddProductModal
          room={room}
          product={selectedProduct}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={(updatedProduct) => {
            handleProductUpdated(updatedProduct);
            setShowEditModal(false);
            setSelectedProduct(null);
            toast.showSuccess('Product updated successfully!');
          }}
        />
      )}

      {showProductDetail && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => {
            setShowProductDetail(false);
            setSelectedProduct(null);
          }}
          onBuy={!isOwner ? () => {
            setShowProductDetail(false);
            setSelectedProduct({
              ...selectedProduct,
              fromCart: false // Ensure this is treated as a direct order
            });
            setShowOrderModal(true);
          } : null}
          onEdit={isOwner && selectedProduct.room?.owner_id === user.id ? () => {
            setShowProductDetail(false);
            // Open edit modal
          } : null}
          onDelete={isOwner && selectedProduct.room?.owner_id === user.id ? () => {
            // Show confirmation dialog
            if (window.confirm('⚠️ Are you sure you want to delete this product? This action cannot be undone.')) {
              handleDeleteProduct(selectedProduct.id);
            }
          } : null}
          isOwner={isOwner}
        />
      )}

      {showOrderModal && selectedProduct && (
        <OrderModal
          product={selectedProduct}
          placedFrom="room"
          onClose={() => {
            setShowOrderModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            setShowOrderModal(false);
            setSelectedProduct(null);
            // Show success message or redirect
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && productToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                    Delete Product
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete <span className="font-semibold">"{productToDelete.name}"</span>?
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                  This will permanently:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    <span>Remove the product permanently</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    <span>Delete all product images</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    <span>Cancel any pending orders</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    <span>Remove from all user carts and favorites</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Delete Product</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

RoomProducts.displayName = 'RoomProducts';

export default RoomProducts; 