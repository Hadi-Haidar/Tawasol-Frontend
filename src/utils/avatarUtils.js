/**
 * Utility functions for consistent avatar handling across the application
 * Unified approach - all users treated the same regardless of type
 */

/**
 * Get the correct avatar URL with improved error handling
 */
export const getAvatarUrl = (avatar) => {
  if (!avatar || avatar === 'null' || avatar.trim() === '') {
    return null;
  }
  
  // Skip default avatars - we'll generate consistent ones in frontend
  if (avatar.startsWith('default:')) {
    return null;
  }
  
  // If avatar starts with http or https, it's an external URL (Google avatar)
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    // For Google avatars, ensure proper format
    if (avatar.includes('googleusercontent.com')) {
      // Optimize Google avatar URL
      if (!avatar.includes('=s96-c-k-no')) {
        let baseUrl = avatar.split('=')[0];
        return `${baseUrl}=s96-c-k-no`;
      }
    }
    return avatar;
  }
  
  // Local uploaded file - use API endpoint
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const filename = avatar.replace('avatars/', '');
  return `${apiBaseUrl}/avatars/${filename}`;
};

/**
 * Generate user initials from name (ALWAYS use this, ignore backend-generated initials)
 */
export const getUserInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  
  const nameParts = name.trim().split(/\s+/).filter(part => part.length > 0);
  if (nameParts.length === 0) return '?';
  
  return nameParts[0].charAt(0).toUpperCase();
};

/**
 * Generate a consistent color for user based on their name (ALWAYS use this, ignore backend colors)
 */
export const getUserAvatarColor = (name, userId) => {
  if (!name && !userId) return 'bg-gray-500';
  
  const seed = name || userId?.toString() || 'default';
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500'
  ];
  
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

/**
 * UNIFIED avatar data generator - treats all users exactly the same
 * This is the main function components should use
 */
export const getAvatarData = (user) => {
  if (!user) {
    return {
      url: null,
      colorClass: 'bg-gray-500',
      initials: '?',
      hasImage: false
    };
  }

  // Try to get image URL (works for Google users and users with uploads)
  const avatarUrl = getAvatarUrl(user.avatar);
  
  // ALWAYS generate consistent initials and color from user name/ID
  // This ensures all users get the same treatment
  const colorClass = getUserAvatarColor(user.name, user.id);
  const initials = getUserInitials(user.name);
  
  return {
    url: avatarUrl,
    colorClass,
    initials: initials || '?',
    hasImage: !!avatarUrl
  };
};

// Legacy functions kept for compatibility (but simplified)
export const isGoogleAvatar = (avatar) => {
  if (!avatar) return false;
  return avatar.startsWith('http://') || avatar.startsWith('https://');
};

export const isDefaultAvatar = (avatar) => {
  if (!avatar) return false;
  return avatar.startsWith('default:');
};

export const parseDefaultAvatar = (avatar) => {
  // Deprecated - we no longer use backend-generated defaults
  return null;
};

export const getAvatarColorClass = (avatar, name, userId) => {
  // Always use frontend generation for consistency
  return getUserAvatarColor(name, userId);
};

export const getAvatarInitials = (avatar, name) => {
  // Always use frontend generation for consistency
  return getUserInitials(name);
};

/**
 * Debug utility
 */
export const debugAvatar = (user) => {
  if (!user) {

    return;
  }

  const avatarData = getAvatarData(user);

  return avatarData;
};

// Make debug function available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.debugAvatar = debugAvatar;
}

/**
 * Validate if an avatar URL is accessible
 */
export const validateAvatarUrl = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    
    setTimeout(() => resolve(false), 5000);
    
    img.src = url;
  });
};

/**
 * Enhanced avatar URL getter with validation
 */
export const getValidatedAvatarUrl = async (avatar) => {
  const url = getAvatarUrl(avatar);
  
  if (!url) {
    return { url: null, isValid: false };
  }
  
  const isValid = await validateAvatarUrl(url);
  return { url, isValid };
}; 