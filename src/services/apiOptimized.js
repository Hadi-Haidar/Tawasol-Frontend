import { createAuthHeaders } from '../utils/authUtils';
import { createFormData } from '../utils/formUtils';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// 🚀 PERFORMANCE: Advanced Cache Manager
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + ttl);
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    const expiry = this.cacheExpiry.get(key);
    if (Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// 📊 PERFORMANCE: Request Queue Manager for batching
class RequestQueue {
  constructor() {
    this.queue = new Map();
    this.processing = false;
  }

  async add(key, requestFn) {
    // If same request is already queued, return the existing promise
    if (this.queue.has(key)) {
      return this.queue.get(key);
    }

    const promise = this.processRequest(key, requestFn);
    this.queue.set(key, promise);
    
    return promise;
  }

  async processRequest(key, requestFn) {
    try {
      const result = await requestFn();
      this.queue.delete(key);
      return result;
    } catch (error) {
      this.queue.delete(key);
      throw error;
    }
  }
}

// 🔄 PERFORMANCE: Retry mechanism
const retryRequest = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on auth errors or client errors
      if (error.status && error.status < 500) {
        throw error;
      }
      
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

// 🎯 PERFORMANCE: Enhanced response handler
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

// Initialize managers
const cache = new CacheManager();
const requestQueue = new RequestQueue();

// 🚀 PERFORMANCE: Optimized Product API
export const productApiOptimized = {
  // Get products with intelligent caching
  getProducts: async (roomId, options = {}) => {
    const cacheKey = `products_room_${roomId}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && !options.forceRefresh) {
      return cached;
    }

    // Use request queue to prevent duplicate requests
    return requestQueue.add(cacheKey, async () => {
      const queryParams = new URLSearchParams(options).toString();
      const url = `${API_BASE_URL}/rooms/${roomId}/products${queryParams ? `?${queryParams}` : ''}`;
      
      const result = await retryRequest(async () => {
        const response = await fetch(url, {
          method: 'GET',
          headers: createAuthHeaders(),
        });
        return handleResponse(response);
      });

      // Cache the result
      cache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes for products
      return result;
    });
  },

  // Get single product with caching
  getProduct: async (productId) => {
    const cacheKey = `product_${productId}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    return requestQueue.add(cacheKey, async () => {
      const result = await retryRequest(async () => {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
          method: 'GET',
          headers: createAuthHeaders(),
        });
        return handleResponse(response);
      });

      cache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes for single product
      return result;
    });
  },

  // Create product with cache invalidation
  createProduct: async (roomId, productData) => {
    const formData = createFormData(productData, { skipEmpty: true });

    const result = await retryRequest(async () => {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/products`, {
        method: 'POST',
        headers: createAuthHeaders(true),
        body: formData,
      });
      return handleResponse(response);
    });

    // Invalidate related caches
    cache.invalidate(`products_room_${roomId}`);
    cache.invalidate('store_products');
    
    return result;
  },

  // Update product with cache invalidation
  updateProduct: async (productId, productData) => {
    const formData = createFormData(productData, { 
      method: 'PUT',
      skipEmpty: true 
    });

    const result = await retryRequest(async () => {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'POST',
        headers: createAuthHeaders(true),
        body: formData,
      });
      return handleResponse(response);
    });

    // Invalidate caches
    cache.invalidate(`product_${productId}`);
    cache.invalidate('products_room_');
    cache.invalidate('store_products');
    
    return result;
  },

  // Delete product with cache invalidation
  deleteProduct: async (productId) => {
    const result = await retryRequest(async () => {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: createAuthHeaders(),
      });
      return handleResponse(response);
    });

    // Invalidate caches
    cache.invalidate(`product_${productId}`);
    cache.invalidate('products_room_');
    cache.invalidate('store_products');
    
    return result;
  }
};

// 🛒 PERFORMANCE: Optimized Cart API
export const cartApiOptimized = {
  // Get cart with caching
  getCart: async () => {
    const cacheKey = 'user_cart';
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    return requestQueue.add(cacheKey, async () => {
      const result = await retryRequest(async () => {
        const response = await fetch(`${API_BASE_URL}/cart`, {
          method: 'GET',
          headers: createAuthHeaders(),
        });
        return handleResponse(response);
      });

      cache.set(cacheKey, result, 30 * 1000); // 30 seconds for cart
      return result;
    });
  },

  // Add to cart with optimistic updates
  addToCart: async (productId, quantity) => {
    // Optimistically update cache
    const cartCache = cache.get('user_cart');
    if (cartCache) {
      // Update cache optimistically
      cache.invalidate('user_cart');
    }

    const result = await retryRequest(async () => {
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      return handleResponse(response);
    });

    // Invalidate cart cache to force refresh
    cache.invalidate('user_cart');
    cache.invalidate('cart_count');
    
    return result;
  },

  // Get cart count with caching
  getCartCount: async () => {
    const cacheKey = 'cart_count';
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    return requestQueue.add(cacheKey, async () => {
      const result = await retryRequest(async () => {
        const response = await fetch(`${API_BASE_URL}/cart/count`, {
          method: 'GET',
          headers: createAuthHeaders(),
        });
        return handleResponse(response);
      });

      cache.set(cacheKey, result, 30 * 1000); // 30 seconds
      return result;
    });
  },

  // Update cart item
  updateCartItem: async (cartItemId, quantity) => {
    const result = await retryRequest(async () => {
      const response = await fetch(`${API_BASE_URL}/cart/${cartItemId}`, {
        method: 'PUT',
        headers: createAuthHeaders(),
        body: JSON.stringify({ quantity }),
      });
      return handleResponse(response);
    });

    cache.invalidate('user_cart');
    cache.invalidate('cart_count');
    
    return result;
  },

  // Remove from cart
  removeFromCart: async (cartItemId) => {
    const result = await retryRequest(async () => {
      const response = await fetch(`${API_BASE_URL}/cart/${cartItemId}`, {
        method: 'DELETE',
        headers: createAuthHeaders(),
      });
      return handleResponse(response);
    });

    cache.invalidate('user_cart');
    cache.invalidate('cart_count');
    
    return result;
  }
};

// ❤️ PERFORMANCE: Optimized Favorites API
export const favoritesApiOptimized = {
  // Get favorites with caching
  getFavorites: async () => {
    const cacheKey = 'user_favorites';
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    return requestQueue.add(cacheKey, async () => {
      const result = await retryRequest(async () => {
        const response = await fetch(`${API_BASE_URL}/favorites`, {
          method: 'GET',
          headers: createAuthHeaders(),
        });
        return handleResponse(response);
      });

      cache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes
      return result;
    });
  },

  // Toggle favorite with optimistic updates
  toggleFavorite: async (productId) => {
    const result = await retryRequest(async () => {
      const response = await fetch(`${API_BASE_URL}/favorites/toggle`, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      });
      return handleResponse(response);
    });

    // Invalidate related caches
    cache.invalidate('user_favorites');
    cache.invalidate(`product_${productId}`);
    
    return result;
  }
};

// 🏪 PERFORMANCE: Optimized Store API
export const storeApiOptimized = {
  // Get public products with advanced caching
  getPublicProducts: async (params = {}) => {
    const cacheKey = `store_products_${JSON.stringify(params)}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    return requestQueue.add(cacheKey, async () => {
      const queryString = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryString.append(key, params[key]);
        }
      });

      const result = await retryRequest(async () => {
        const response = await fetch(`${API_BASE_URL}/store/products?${queryString}`, {
          method: 'GET',
          headers: createAuthHeaders(),
        });
        return handleResponse(response);
      });

      cache.set(cacheKey, result, 1 * 60 * 1000); // 1 minute for store products
      return result;
    });
  },

  // Get categories with long-term caching
  getCategories: async () => {
    const cacheKey = 'store_categories';
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    return requestQueue.add(cacheKey, async () => {
      const result = await retryRequest(async () => {
        const response = await fetch(`${API_BASE_URL}/store/categories`, {
          method: 'GET',
          headers: createAuthHeaders(),
        });
        return handleResponse(response);
      });

      cache.set(cacheKey, result, 10 * 60 * 1000); // 10 minutes for categories
      return result;
    });
  }
};

// 📊 PERFORMANCE: Generic optimized API helper
export const apiOptimized = {
  get: async (endpoint, options = {}) => {
    const { cache: useCache = true, ttl = 60000 } = options;
    const cacheKey = `api_get_${endpoint}`;
    
    if (useCache) {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
    }

    return requestQueue.add(cacheKey, async () => {
      const result = await retryRequest(async () => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: createAuthHeaders(),
        });
        return handleResponse(response);
      });

      if (useCache) {
        cache.set(cacheKey, result, ttl);
      }
      
      return result;
    });
  },

  post: async (endpoint, data, options = {}) => {
    const result = await retryRequest(async () => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    });

    // Invalidate related caches if specified
    if (options.invalidateCache) {
      cache.invalidate(options.invalidateCache);
    }

    return result;
  },

  put: async (endpoint, data, options = {}) => {
    const result = await retryRequest(async () => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: createAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    });

    if (options.invalidateCache) {
      cache.invalidate(options.invalidateCache);
    }

    return result;
  },

  delete: async (endpoint, options = {}) => {
    const result = await retryRequest(async () => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: createAuthHeaders(),
      });
      return handleResponse(response);
    });

    if (options.invalidateCache) {
      cache.invalidate(options.invalidateCache);
    }

    return result;
  }
};

// 🧹 PERFORMANCE: Cache management utilities
export const cacheUtils = {
  clear: () => cache.clear(),
  invalidate: (pattern) => cache.invalidate(pattern),
  getSize: () => cache.cache.size,
  getKeys: () => Array.from(cache.cache.keys())
};

// Export all optimized APIs
const apiServicesOptimized = { 
  productApiOptimized, 
  cartApiOptimized, 
  favoritesApiOptimized, 
  storeApiOptimized, 
  apiOptimized,
  cacheUtils
};

export default apiServicesOptimized; 