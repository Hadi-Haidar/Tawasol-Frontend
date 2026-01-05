import { createAuthHeaders } from '../utils/authUtils';
import { createFormData } from '../utils/formUtils';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Product API
export const productApi = {
  // Get all products in a room
  getProducts: async (roomId) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/products`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get single product
  getProduct: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create new product
  createProduct: async (roomId, productData) => {
    const formData = createFormData(productData, { skipEmpty: true });

    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/products`, {
      method: 'POST',
      headers: createAuthHeaders(true),
      body: formData,
    });
    return handleResponse(response);
  },

    // Update product
  updateProduct: async (productId, productData) => {
    const formData = createFormData(productData, { 
      method: 'PUT',
      skipEmpty: true 
    });

    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'POST',
        headers: createAuthHeaders(true),
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      return response.json();
    } catch (error) {
      throw error;
    }
  },

  // Delete product
  deleteProduct: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Order API
export const orderApi = {
  // Create new order
  createOrder: async (orderData) => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(orderData),
    });
    return handleResponse(response);
  },

  // Get all orders for current user
  getOrders: async () => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get single order
  getOrder: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Update order status (seller only)
  updateOrderStatus: async (orderId, status) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  // Cancel order (buyer only)
  cancelOrder: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Send message in order chat
  sendMessage: async (orderId, messageData) => {
    const formData = createFormData(messageData, { skipEmpty: true });

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/messages`, {
      method: 'POST',
      headers: createAuthHeaders(true),
      body: formData,
    });
    return handleResponse(response);
  },

  // Get order messages
  getMessages: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/messages`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Delete chat for the current user
  deleteChat: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/chat`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Generic API helper for other endpoints
export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  post: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  put: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Cart API
export const cartApi = {
  // Get cart items
  getCart: async () => {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Add item to cart
  addToCart: async (productId, quantity) => {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    return handleResponse(response);
  },

  // Update cart item quantity
  updateCartItem: async (cartItemId, quantity) => {
    const response = await fetch(`${API_BASE_URL}/cart/${cartItemId}`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify({ quantity }),
    });
    return handleResponse(response);
  },

  // Remove item from cart
  removeFromCart: async (cartItemId) => {
    const response = await fetch(`${API_BASE_URL}/cart/${cartItemId}`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Clear entire cart
  clearCart: async () => {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get cart count
  getCartCount: async () => {
    const response = await fetch(`${API_BASE_URL}/cart/count`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Purchase all items in cart
  purchaseAll: async (orderData) => {
    const response = await fetch(`${API_BASE_URL}/cart/purchase-all`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(orderData),
    });
    return handleResponse(response);
  },
};

// Favorites API
export const favoritesApi = {
  // Get favorite products
  getFavorites: async () => {
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Toggle favorite status
  toggleFavorite: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/favorites/toggle`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({ product_id: productId }),
    });
    return handleResponse(response);
  },

  // Remove from favorites
  removeFavorite: async (favoriteId) => {
    const response = await fetch(`${API_BASE_URL}/favorites/${favoriteId}`, {
      method: 'DELETE',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Check if product is favorited
  checkFavorite: async (productId) => {
    const response = await fetch(`${API_BASE_URL}/favorites/check/${productId}`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Store API
export const storeApi = {
  // Get all public products
  getPublicProducts: async (params = {}) => {
    const queryString = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryString.append(key, params[key]);
      }
    });

    const response = await fetch(`${API_BASE_URL}/store/products?${queryString}`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get categories for filtering
  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/store/categories`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get rooms with public products
  getRoomsWithPublicProducts: async () => {
    const response = await fetch(`${API_BASE_URL}/store/rooms`, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Toggle product visibility
  toggleProductVisibility: async (productId, visibility) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/visibility`, {
      method: 'PUT',
      headers: createAuthHeaders(),
      body: JSON.stringify({ visibility }),
    });
    return handleResponse(response);
  },
};

// Room usage methods
export const roomUsageApi = {
  async getRoomUsageSummary() {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/usage/summary`, {
        method: 'GET',
        headers: createAuthHeaders(),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Error fetching room usage:', error);
      throw error;
    }
  },
};

const apiServices = { productApi, orderApi, api, cartApi, favoritesApi, storeApi, roomUsageApi };
export default apiServices; 
