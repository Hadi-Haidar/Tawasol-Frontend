import React from 'react';

const LoadingSpinner = ({ 
  message = "Loading...", 
  size = "default", 
  fullScreen = false,
  className = ""
}) => {
  const sizeClasses = {
    small: "h-6 w-6",
    default: "h-12 w-12",
    large: "h-16 w-16"
  };

  const textSizeClasses = {
    small: "text-sm",
    default: "text-base",
    large: "text-lg"
  };

  const containerClasses = fullScreen 
    ? "min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
    : "flex items-center justify-center p-8";

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        {/* Spinning Circle */}
        <div className="flex justify-center mb-4">
          <div className={`animate-spin rounded-full border-b-2 border-purple-600 ${sizeClasses[size]}`}></div>
        </div>
        
        {/* Loading Message */}
        <p className={`text-gray-600 dark:text-gray-400 ${textSizeClasses[size]}`}>
          {message}
        </p>
      </div>
    </div>
  );
};

// Specialized loading components for different contexts
export const PageLoader = ({ message = "Loading...", className = "" }) => (
  <LoadingSpinner 
    message={message} 
    size="default" 
    fullScreen={true} 
    className={className}
  />
);

export const SectionLoader = ({ message = "Loading...", className = "" }) => (
  <LoadingSpinner 
    message={message} 
    size="default" 
    fullScreen={false} 
    className={className}
  />
);

export const ButtonLoader = ({ message = "Loading...", className = "" }) => (
  <LoadingSpinner 
    message={message} 
    size="small" 
    fullScreen={false} 
    className={className}
  />
);

export const InlineLoader = ({ message = "", className = "" }) => (
  <div className={`flex items-center space-x-2 ${className}`}>
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
    {message && <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>}
  </div>
);

export default LoadingSpinner; 