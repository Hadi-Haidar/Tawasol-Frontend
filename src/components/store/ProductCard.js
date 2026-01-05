import React, { useState } from 'react';
import { 
  HeartIcon,
  ShoppingCartIcon,
  EyeIcon,
  TagIcon,
  UserIcon,
  HomeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import StarRating from '../common/StarRating';
import OptimizedImage from '../common/OptimizedImage';

const ProductCard = ({ 
  product, 
  onLike, 
  onAddToCart, 
  onView,
  showActions = {
    favorite: true,
    addToCart: true,
    view: true
  },
  isOwner = false,
  className = ""
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (isLiking || !onLike) return;
    
    setIsLiking(true);
    try {
      await onLike(product.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (isAddingToCart || !onAddToCart || isOwner) return;
    
    setIsAddingToCart(true);
    try {
      await onAddToCart(product.id);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleView = (e) => {
    e.stopPropagation();
    if (onView) onView(product);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  const getImageSrc = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0].file_path;
    }
    return null; // OptimizedImage will handle the fallback
  };

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group ${className}`}>
      {/* Product Image Container */}
      <div className="relative">
        <OptimizedImage
          src={getImageSrc()}
          alt={product.name}
          className="group-hover:scale-105 transition-transform duration-300"
          aspectRatio="aspect-[5/4]"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2">
            {showActions.view && (
              <button
                onClick={handleView}
                className="bg-white text-gray-800 p-1.5 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                title="View Details"
              >
                <EyeIcon className="w-4 h-4" />
              </button>
            )}
            
            {showActions.favorite && (
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`p-1.5 rounded-full transition-colors shadow-lg ${
                  product.is_liked 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-white text-gray-800 hover:bg-gray-100'
                }`}
                title={product.is_liked ? "Remove from Favorites" : "Add to Favorites"}
              >
                {product.is_liked ? (
                  <HeartSolidIcon className="w-4 h-4" />
                ) : (
                  <HeartIcon className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Stock Badge */}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute top-1.5 left-1.5 bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium">
            Only {product.stock} left
          </div>
        )}
        
        {product.stock === 0 && (
          <div className="absolute top-1.5 left-1.5 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium">
            Out of Stock
          </div>
        )}

        {/* Category Badge */}
        {product.category && (
          <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium flex items-center">
            <TagIcon className="w-3 h-3 mr-0.5" />
            {product.category}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 text-base mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="mb-2">
          <StarRating 
            rating={product.average_rating || 0} 
            size="small" 
            showNumber={true}
            totalReviews={product.reviews_count || 0}
          />
        </div>

        {/* Price */}
        <div className="flex items-center mb-2">
          <CurrencyDollarIcon className="w-4 h-4 text-green-600 mr-1" />
          <span className="text-xl font-bold text-green-600">
            {formatPrice(product.price)}
          </span>
        </div>

        {/* Room and Owner Info (for store page) */}
        {product.room && (
          <div className="space-y-0.5 mb-2 text-xs text-gray-600">
            <div className="flex items-center">
              <HomeIcon className="w-3 h-3 mr-1" />
              <span className="truncate">{product.room.name}</span>
            </div>
            {product.room.owner && (
              <div className="flex items-center">
                <UserIcon className="w-3 h-3 mr-1" />
                <span className="truncate">by {product.room.owner.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {product.description && (
          <p className="text-gray-600 text-xs mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {showActions.addToCart && !isOwner && product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
            >
              <ShoppingCartIcon className="w-3 h-3 mr-1.5" />
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
          )}

          {isOwner && (
            <div className="flex-1 bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg text-center text-xs">
              Your Product
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 