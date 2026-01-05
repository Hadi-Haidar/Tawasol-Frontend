import React from 'react';
import { FaStar, FaRegStar, FaStarHalfAlt } from 'react-icons/fa';

const StarRating = ({ rating, size = 'small', showNumber = true, totalReviews = null }) => {
  // Ensure rating is a valid number
  const validRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0;
  
  // Debug logging for problematic cases
  if (totalReviews > 0 && validRating === 0) {}
  
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(validRating);
    const hasHalfStar = validRating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar 
          key={`full-${i}`} 
          className={`text-yellow-500 ${getStarSize()}`}
        />
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <FaStarHalfAlt 
          key="half" 
          className={`text-yellow-500 ${getStarSize()}`}
        />
      );
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaRegStar 
          key={`empty-${i}`} 
          className={`text-gray-300 ${getStarSize()}`}
        />
      );
    }

    return stars;
  };

  const getStarSize = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-lg';
      case 'large':
        return 'text-xl';
      case 'xl':
        return 'text-2xl';
      default:
        return 'text-sm';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      case 'xl':
        return 'text-xl';
      default:
        return 'text-sm';
    }
  };

  if (validRating === 0) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <FaRegStar key={i} className={`text-gray-400 ${getStarSize()}`} />
          ))}
        </div>
        {showNumber && (
          <span className={`text-gray-500 ${getTextSize()}`}>
            {totalReviews === 0 || totalReviews === null ? 'No reviews yet' : `0.0`}
            {totalReviews !== null && totalReviews > 0 && (
              <span className="ml-1">
                ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
              </span>
            )}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex">{renderStars()}</div>
      {showNumber && (
        <span className={`text-gray-700 ${getTextSize()}`}>
          <span className="font-medium">{validRating.toFixed(1)}</span>
          {totalReviews !== null && totalReviews > 0 && (
            <span className="text-gray-500 ml-1">
              ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
            </span>
          )}
        </span>
      )}
    </div>
  );
};

export default StarRating; 