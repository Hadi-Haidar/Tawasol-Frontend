import React, { useState, useRef, useEffect } from 'react';
import ImageSkeleton from './ImageSkeleton';

const OptimizedImage = ({
  src,
  alt = "",
  className = "",
  aspectRatio = "aspect-[5/4]",
  fallbackSrc = "/api/placeholder/300/200",
  onLoad,
  onError,
  priority = false, // For critical images that should load immediately
  width,
  height,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer for lazy loading (skip for priority images)
  useEffect(() => {
    if (priority) {
      // Priority images load immediately
      setIsInView(true);
      return;
    }

    const currentImgRef = imgRef.current;
    
    if (!currentImgRef) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '100px', // Load images 100px before they're visible for better UX
        threshold: 0.1
      }
    );

    observerRef.current.observe(currentImgRef);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  const handleImageLoad = (e) => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.(e);
  };

  const handleImageError = (e) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(e);
    
    // Try fallback if not already using it
    if (e.target.src !== fallbackSrc) {
      e.target.src = fallbackSrc;
      setHasError(false);
      setIsLoading(true);
    }
  };

  const getImageSrc = () => {
    if (!src) return fallbackSrc;
    
    // If it's already a full URL, return as is
    if (src.startsWith('http') || src.startsWith('/api/placeholder')) {
      return src;
    }
    
    // Use optimized image endpoint for better performance
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    
    // Extract filename from path (e.g., "product-images/abc123.jpg" -> "abc123.jpg")
    let filename = src;
    if (src.includes('/')) {
      filename = src.split('/').pop();
    }
    
    // Use optimized endpoint
    return `${apiUrl}/api/images/products/${filename}`;
  };

  return (
    <div 
      ref={imgRef} 
      className={`relative ${aspectRatio} ${className} overflow-hidden`}
      style={{
        // Ensure container has explicit dimensions if provided
        ...(width && { width: `${width}px` }),
        ...(height && { height: `${height}px` }),
        // Prevent layout shift
        minHeight: height ? `${height}px` : undefined
      }}
    >
      {/* Show skeleton while loading or not in view */}
      {(isLoading || !isInView) && (
        <ImageSkeleton 
          className="absolute inset-0" 
          aspectRatio="w-full h-full" 
        />
      )}
      
      {/* Actual image - only load when in view */}
      {isInView && (
        <img
          src={getImageSrc()}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } ${props.className || ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          {...(width && { width })}
          {...(height && { height })}
          style={{
            // Prevent layout shift with explicit dimensions
            ...(width && { width: `${width}px` }),
            ...(height && { height: `${height}px` }),
            ...props.style
          }}
          {...props}
        />
      )}
      
      {/* Error state */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-400 dark:text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <p className="text-xs">Image failed to load</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage; 