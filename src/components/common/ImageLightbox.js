import React, { useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ImageLightbox = ({ 
  isOpen, 
  imageUrl, 
  imageAlt = "Image", 
  onClose 
}) => {
  // Handle ESC key press
  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Handle outside click
  const handleOverlayClick = useCallback((event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Effect for keyboard listener and body scroll prevention
  useEffect(() => {
    if (isOpen) {
      // Add keyboard listener
      document.addEventListener('keydown', handleKeyPress);
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Cleanup: remove listener and restore scrolling
        document.removeEventListener('keydown', handleKeyPress);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, handleKeyPress]);

  // Don't render if not open
  if (!isOpen || !imageUrl) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-out"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* Modal Content */}
      <div className="relative max-h-[90vh] max-w-[90vw] animate-fadeInScale">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Close image"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Image */}
        <img
          src={imageUrl}
          alt={imageAlt}
          className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl object-contain"
          style={{ 
            maxHeight: '90vh', 
            maxWidth: '90vw',
            width: 'auto',
            height: 'auto'
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on image
        />
      </div>
    </div>
  );
};

export default ImageLightbox; 