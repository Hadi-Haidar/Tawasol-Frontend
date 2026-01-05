import React, { useState, useEffect } from 'react';
import { getAvatarData } from '../../utils/avatarUtils';
import { User } from 'lucide-react';

const Avatar = ({ 
  user, 
  size = 'md', 
  className = '', 
  showBorder = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(0); // Force re-render when needed
  
  // Size mappings with explicit pixel dimensions for CLS prevention
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl',
    '3xl': 'w-24 h-24 text-2xl'
  };

  // Explicit pixel dimensions for images to prevent CLS
  const imageDimensions = {
    xs: { width: 24, height: 24 },
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 },
    '2xl': { width: 80, height: 80 },
    '3xl': { width: 96, height: 96 }
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const dimensions = imageDimensions[size] || imageDimensions.md;
  const avatarData = getAvatarData(user);
  const borderClass = showBorder ? 'border-2 border-white dark:border-gray-800 shadow-sm' : '';
  const baseClasses = `${sizeClass} rounded-full flex items-center justify-center ${borderClass} ${className}`;

  // Reset error state when user changes or avatar updates
  useEffect(() => {
    setImageError(false);
    setImageKey(prev => prev + 1); // Force image re-render
  }, [user?.id, user?.avatar, user?.avatarUpdatedAt, user?._forceUpdate]);

  const handleImageError = () => {setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  // Show fallback if no image URL or image error occurred
  const showFallback = !avatarData.hasImage || imageError;

  return (
    <div className="relative inline-block">
      {!showFallback && (
        <img 
          key={`avatar-${user?.id}-${imageKey}`} // Force re-render on updates
          src={avatarData.url}
          alt={user?.name || 'User'}
          className={`${baseClasses} object-cover`}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="eager" // Critical avatars load immediately to prevent CLS
          decoding="sync"
          width={dimensions.width}
          height={dimensions.height}
          style={{ 
            width: `${dimensions.width}px`, 
            height: `${dimensions.height}px`,
            minWidth: `${dimensions.width}px`,
            minHeight: `${dimensions.height}px`
          }}
        />
      )}
      
      {/* Fallback avatar */}
      {showFallback && (
        <div 
          className={`${baseClasses} ${avatarData.colorClass} text-white font-medium`}
          style={{ 
            width: `${dimensions.width}px`, 
            height: `${dimensions.height}px`,
            minWidth: `${dimensions.width}px`,
            minHeight: `${dimensions.height}px`
          }}
        >
          {avatarData.initials !== '?' ? (
            <span className="select-none">{avatarData.initials}</span>
          ) : (
            <User size={
              size === 'xs' ? 12 : 
              size === 'sm' ? 14 : 
              size === 'md' ? 16 : 
              size === 'lg' ? 20 :
              size === 'xl' ? 24 :
              size === '2xl' ? 28 :
              size === '3xl' ? 32 : 20
            } />
          )}
        </div>
      )}
    </div>
  );
};

export default Avatar; 