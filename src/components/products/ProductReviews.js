import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaStar, FaEdit, FaTrash } from 'react-icons/fa';
import StarRating from '../common/StarRating';
import apiService from '../../services/apiService';

const ProductReviews = ({ productId, currentUser }) => {
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    average_rating: 0,
    reviews_count: 0,
    rating_distribution: {}
  });
  const [userReview, setUserReview] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    rating: 0,
    review_text: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (productId) {
      loadReviews();
      if (currentUser) {
        checkCanReview();
        loadUserReview();
      }
    }
  }, [productId, currentUser]);

  const loadReviews = async (page = 1) => {
    try {
      const response = await apiService.getAxiosInstance().get(`/products/${productId}/reviews?page=${page}`);
      const { reviews: reviewsData, average_rating, reviews_count, rating_distribution } = response.data;
      
      if (page === 1) {
        setReviews(reviewsData.data);
      } else {
        setReviews(prev => [...prev, ...reviewsData.data]);
      }
      
      setReviewStats({
        average_rating,
        reviews_count,
        rating_distribution
      });
      
      setHasMore(reviewsData.current_page < reviewsData.last_page);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const response = await apiService.getAxiosInstance().get(`/products/${productId}/reviews/can-review`);
      setCanReview(response.data.can_review);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const loadUserReview = async () => {
    try {
      const response = await apiService.getAxiosInstance().get(`/products/${productId}/reviews/user`);
      setUserReview(response.data.review);
    } catch (error) {
      console.error('Error loading user review:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      let response;
      if (isEditing && userReview) {
        response = await apiService.getAxiosInstance().put(`/products/${productId}/reviews/${userReview.id}`, formData);
        toast.success('Review updated successfully');
      } else {
        response = await apiService.getAxiosInstance().post(`/products/${productId}/reviews`, formData);
        toast.success('Review submitted successfully');
      }

      // Update local state
      setUserReview(response.data.review);
      setReviewStats(prev => ({
        ...prev,
        average_rating: response.data.new_average_rating,
        reviews_count: response.data.new_reviews_count
      }));
      
      // Reload reviews to show the new/updated review
      loadReviews(1);
      
      // Reset form
      setFormData({ rating: 0, review_text: '' });
      setShowReviewForm(false);
      setIsEditing(false);
      setCanReview(false);

    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = () => {
    setFormData({
      rating: userReview.rating,
      review_text: userReview.review_text || ''
    });
    setIsEditing(true);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async () => {
    if (!userReview || !window.confirm('Are you sure you want to delete your review?')) {
      return;
    }

    try {
      const response = await apiService.getAxiosInstance().delete(`/products/${productId}/reviews/${userReview.id}`);
      
      setUserReview(null);
      setCanReview(true);
      setReviewStats(prev => ({
        ...prev,
        average_rating: response.data.new_average_rating,
        reviews_count: response.data.new_reviews_count
      }));
      
      // Reload reviews
      loadReviews(1);
      toast.success('Review deleted successfully');

    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const StarSelector = ({ value, onChange }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition-colors ${
            star <= value ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
          }`}
        >
          <FaStar />
        </button>
      ))}
    </div>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {reviewStats.average_rating.toFixed(1)}
            </div>
            <StarRating rating={reviewStats.average_rating} size="medium" showNumber={false} />
            <div className="text-sm text-gray-500 mt-1">
              {reviewStats.reviews_count} review{reviewStats.reviews_count !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviewStats.rating_distribution[rating] || 0;
              const percentage = reviewStats.reviews_count > 0 
                ? (count / reviewStats.reviews_count) * 100 
                : 0;
              
              return (
                <div key={rating} className="flex items-center gap-2 mb-1">
                  <span className="text-sm w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* User's Review or Review Form */}
        {currentUser && (
          <div className="border-t pt-4">
            {userReview && !showReviewForm ? (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <StarRating rating={userReview.rating} size="small" showNumber={false} />
                    <p className="text-sm text-gray-600 mt-1">Your review</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditReview}
                      className="text-blue-600 hover:text-blue-800 text-sm p-1"
                      title="Edit Review"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={handleDeleteReview}
                      className="text-red-600 hover:text-red-800 text-sm p-1"
                      title="Delete Review"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                {userReview.review_text && (
                  <p className="text-gray-700">{userReview.review_text}</p>
                )}
              </div>
            ) : showReviewForm ? (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating *
                  </label>
                  <StarSelector 
                    value={formData.rating} 
                    onChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review (optional)
                  </label>
                  <textarea
                    value={formData.review_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, review_text: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Share your experience with this product..."
                    maxLength={1000}
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {formData.review_text.length}/1000 characters
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting || formData.rating === 0}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : (isEditing ? 'Update Review' : 'Submit Review')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewForm(false);
                      setIsEditing(false);
                      setFormData({ rating: 0, review_text: '' });
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
                          ) : canReview ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Write a Review
                </button>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Want to leave a review?</strong> You can review this product after purchasing it. 
                  Reviews help other customers make informed decisions!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">All Reviews</h4>
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {review.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{review.user.name}</div>
                    <StarRating rating={review.rating} size="small" showNumber={false} />
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(review.created_at)}
                </div>
              </div>
              {review.review_text && (
                <p className="text-gray-700 mt-2">{review.review_text}</p>
              )}
            </div>
          ))}
          
          {hasMore && (
            <div className="text-center">
              <button
                onClick={() => loadReviews(currentPage + 1)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Load More Reviews
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      )}
    </div>
  );
};

export default ProductReviews; 