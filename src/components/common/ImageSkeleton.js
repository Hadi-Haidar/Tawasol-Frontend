import React from 'react';

const ImageSkeleton = ({ className = "", aspectRatio = "aspect-[5/4]" }) => {
  return (
    <div className={`${aspectRatio} ${className} bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg overflow-hidden`}>
      <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-shimmer">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 text-gray-400 dark:text-gray-500">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSkeleton; 