// API Configuration
export const API_CONFIG = {
  BASE_URL: (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace('/api', ''),
  ENDPOINTS: {
    ROOMS: '/api/rooms',
    PUBLIC_POSTS: '/api/public-posts',
    FEATURED_POSTS: '/api/featured-public-posts'
  }
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export default API_CONFIG; 