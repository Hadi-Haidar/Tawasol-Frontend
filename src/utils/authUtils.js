/**
 * Authentication utilities for consistent token and header handling
 */

/**
 * Get authentication token from storage
 * @returns {string|null} The authentication token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

/**
 * Create standardized headers with authentication
 * @param {boolean} isFormData - Whether the request uses FormData (affects Content-Type)
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} Headers object with authentication
 */
export const createAuthHeaders = (isFormData = false, additionalHeaders = {}) => {
  const headers = {
    'Accept': 'application/json',
    ...additionalHeaders
  };
  
  // Only set Content-Type for non-FormData requests
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Create a fetch request with standardized authentication
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {boolean} isFormData - Whether the request uses FormData
 * @returns {Promise} Fetch promise
 */
export const authenticatedFetch = (url, options = {}, isFormData = false) => {
  const headers = createAuthHeaders(isFormData, options.headers);
  
  return fetch(url, {
    ...options,
    headers
  });
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has a valid token
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Clear authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}; 