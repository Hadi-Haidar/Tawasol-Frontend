import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { MessageSquare, Clock, Users, Eye, MoreHorizontal, X, Crown, Star, Flag, ImageIcon } from 'lucide-react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl, isDefaultAvatar, parseDefaultAvatar, getAvatarColorClass, getAvatarInitials } from '../../utils/avatarUtils';
import AudioPlayer from '../audio/AudioPlayer';
import ViewRoomModal from '../modals/ViewRoomModal';
import SimpleToast from '../ui/SimpleToast';
import ReportPostModal from './ReportPostModal';
import Avatar from '../common/Avatar';
import apiService from '../../services/apiService';

const PostCard = memo(({ post, showRoomInfo = false, onViewComments, onEdit, onDelete, className = "", showPublicTimer = false, onPostUpdate, priority = false }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showViewRoomModal, setShowViewRoomModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [isLiked, setIsLiked] = useState(post.is_liked_by_user || false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Optimized Image Component (inline to avoid new files)
  const OptimizedImage = ({ src, alt, index, onClick }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority && index < 2); // Load first 2 immediately if priority
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);
    const observerRef = useRef(null);

    useEffect(() => {
      if (priority && index < 2) return; // Skip observer for priority images
      if (isInView) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              if (observerRef.current) {
                observerRef.current.disconnect();
              }
            }
          });
        },
        { rootMargin: '50px', threshold: 0.1 }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
        observerRef.current = observer;
      }

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, [index, isInView]);

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
      setHasError(false);
    }, []);

    const handleError = useCallback(() => {
      setHasError(true);
      setIsLoaded(false);
    }, []);

    return (
      <div 
        ref={imgRef}
        className="relative w-full h-48 overflow-hidden rounded-xl shadow-sm"
        style={{ minHeight: '192px' }}
      >
        {/* Skeleton placeholder */}
        {(!isInView || !isLoaded) && !hasError && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
            <ImageIcon size={24} className="text-gray-400 dark:text-gray-500" />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center">
            <ImageIcon size={32} className="text-gray-400 dark:text-gray-500 mb-2" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Image unavailable</span>
          </div>
        )}

        {/* Actual image */}
        {isInView && !hasError && (
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover cursor-pointer hover:opacity-95 transition-all duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ minHeight: '192px' }}
            onLoad={handleLoad}
            onError={handleError}
            onClick={onClick}
            loading={priority && index < 2 ? "eager" : "lazy"}
            decoding={priority && index < 2 ? "sync" : "async"}
            width="320"
            height="192"
          />
        )}
      </div>
    );
  };

  const canEdit = user && (user.id === post.user_id || user.id === post.room?.owner_id);
  const canReport = user && post.visibility === 'public' && user.id !== post.user_id;

  // Debug logging for permission issues
  if (process.env.NODE_ENV === 'development') {}

  const openImageModal = useCallback((imageUrl) => {
    setImageLoading(true);
    setSelectedImage(imageUrl);
  }, []);

  const closeImageModal = useCallback(() => {
    setSelectedImage(null);
    setImageLoading(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleModalBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      closeImageModal();
    }
  }, [closeImageModal]);

  const handleViewRoom = useCallback(() => {
    if (post.room) {
      setShowViewRoomModal(true);
    }
  }, [post.room]);

  const handleViewRoomSuccess = useCallback((message) => {
    setToast({ message, type: 'success' });
  }, []);

  const handleViewRoomError = useCallback((message) => {
    setToast({ message, type: 'error' });
  }, []);

  const handleReportPost = useCallback(() => {
    setShowReportModal(true);
    setShowMenu(false);
  }, []);

  const handleReportSuccess = useCallback((message) => {
    setToast({ message, type: 'success' });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  const handleLike = async () => {
    if (isLiking) return; // Prevent double-clicking
    
    setIsLiking(true);
    
    try {
      // Always call the like endpoint - it handles toggling on the backend
      const response = await apiService.posts.like(post.room_id, post.id);
      
      // Update local state based on backend response
      setIsLiked(response.is_liked);
      setLikeCount(response.likes_count);
      
      // Update parent component's state
      if (onPostUpdate) {
        onPostUpdate({
          ...post,
          is_liked_by_user: response.is_liked,
          likes_count: response.likes_count
        });
      }} catch (error) {
      console.error('❌ Error toggling like:', error);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.response?.data?.message);
      
      const errorMessage = error.response?.data?.message || 'Failed to update like status';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsLiking(false);
    }
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedImage) {
        closeImageModal();
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  // Sync like state with post prop changes
  useEffect(() => {
    setIsLiked(post.is_liked_by_user || false);
    setLikeCount(post.likes_count || 0);
  }, [post.is_liked_by_user, post.likes_count]);

  // Calculate time remaining for public posts (only when showPublicTimer is true)
  useEffect(() => {
    if (post.visibility === 'public' && showPublicTimer) {
      const updateTimeRemaining = () => {
        // Use published_at if available, otherwise fall back to created_at
        const publishTime = new Date(post.published_at || post.created_at);
        const expiryTime = new Date(publishTime.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
        const now = new Date();
        const diff = expiryTime - now;

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m left`);
          } else if (minutes > 0) {
            setTimeRemaining(`${minutes}m left`);
          } else {
            setTimeRemaining('Expiring soon');
          }
        } else {
          setTimeRemaining('Expired');
        }
      };

      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [post.created_at, post.published_at, post.visibility, showPublicTimer]);

  const getSubscriptionBadge = () => {
    const subscriptionLevel = post.author?.subscription_level;
    
    switch (subscriptionLevel) {
      case 'gold':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
            <Crown size={12} className="mr-1 text-yellow-600" />
            Gold User
          </span>
        );
      case 'silver':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            <Star size={12} className="mr-1 text-gray-600" />
            Silver User
          </span>
        );
      default:
        return null;
    }
  };

    // Avatar rendering logic using the standardized Avatar component
  const renderAvatar = () => {
    // Debug: Log avatar data for Google users (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Avatar debug data:', {
        subscriptionLevel: post.author?.subscription_level,
        authorData: post.author
      });
    }

    // For premium users, add gradient border wrapper
    const isPremium = post.author?.subscription_level === 'gold' || post.author?.subscription_level === 'silver';
    
    if (isPremium) {
      return (
        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 p-0.5 shadow-lg ${
          post.author?.subscription_level === 'gold' 
            ? 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 shadow-yellow-400/30' 
            : 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 shadow-slate-400/30'
        }`}>
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            <Avatar 
              user={post.author} 
              size="lg" 
              className="border-0 shadow-none"
            />
          </div>
        </div>
      );
    }

    // Regular users - use Avatar component directly
    return (
      <Avatar 
        user={post.author} 
        size="lg" 
        className="shadow-sm" 
      />
    );
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      {/* Main Post Card - Modern card with rounded-2xl and shadow-lg */}
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}>
        {/* Header Section with improved spacing */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {/* Enhanced User Avatar */}
              {renderAvatar()}
              
              {/* User Info with better typography */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                    {post.author?.name || 'Unknown User'}
                  </h3>
                  {getSubscriptionBadge()}
                </div>
                
                {/* Enhanced Timestamp and Privacy with better spacing */}
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  {showRoomInfo && (
                    <>
                      <span>in</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        <Users size={12} className="mr-1" />
                        {post.room?.name || 'Unknown Room'}
                      </span>
                      <span>•</span>
                    </>
                  )}
                  <Clock size={12} />
                  <span>{formatDate(post.created_at)}</span>
                  {post.visibility === 'public' && showPublicTimer && timeRemaining && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                        <Clock size={12} />
                        <span className="text-xs font-medium">{timeRemaining}</span>
                      </div>
                    </>
                  )}
                  {post.visibility === 'public' && !showPublicTimer && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        <Eye size={12} className="mr-1" />
                        Public
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Featured Badge and Actions Menu with proper spacing */}
            <div className="flex items-center space-x-2 relative">
              {post.is_featured && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 shadow-sm">
                  ⭐ Featured
                </span>
              )}
              
              {(canEdit || canReport) && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                      <div className="py-1">
                        {canEdit && onEdit && (
                          <button
                            onClick={() => {
                              onEdit(post);
                              setShowMenu(false);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            Edit Post
                          </button>
                        )}
                        {canEdit && onDelete && (
                          <button
                            onClick={() => {
                              onDelete(post);
                              setShowMenu(false);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            Delete Post
                          </button>
                        )}
                        {canReport && (
                          <>
                            {canEdit && <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>}
                            <button
                              onClick={handleReportPost}
                              className="flex items-center w-full px-4 py-2 text-left text-sm text-orange-600 dark:text-orange-400 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                              <Flag size={14} className="mr-2" />
                              Report Post
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Body Section with enhanced typography */}
          <div className="space-y-4">
            {/* Post Title with better typography */}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
              {post.title}
            </h2>
            
            {/* Post Content with improved readability */}
            <div className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              {post.content.length > 300 
                ? `${post.content.substring(0, 300)}...` 
                : post.content
              }
            </div>

            {/* Enhanced Media Display with video support */}
            {post.media && post.media.length > 0 && (
              <div className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {post.media.slice(0, 6).map((media, index) => {
                    const mediaUrl = `http://localhost:8000/storage/${media.file_path}`;
                    
                    if (media.media_type === 'image') {
                      return (
                        <div key={index} className="relative">
                          <OptimizedImage
                            src={mediaUrl}
                            alt="Post image"
                            index={index}
                            onClick={() => openImageModal(mediaUrl)}
                          />
                          {index === 5 && post.media.length > 6 && (
                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-xl cursor-pointer"
                                 onClick={() => openImageModal(mediaUrl)}>
                              <span className="text-white font-semibold text-sm">
                                +{post.media.length - 6}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    } else if (media.media_type === 'video') {
                      return (
                        <div key={index} className="relative">
                          <div className="relative w-full h-48 overflow-hidden rounded-xl shadow-sm">
                            <video
                              src={mediaUrl}
                              controls
                              className="w-full h-full object-cover rounded-xl"
                              onError={(e) => {
                                console.error('Video failed to load:', mediaUrl);
                                // Show fallback UI
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                              width="320"
                              height="192"
                              style={{
                                width: "100%",
                                height: "192px",
                                minHeight: "192px"
                              }}
                            >
                              Your browser does not support the video tag.
                            </video>
                            {/* Fallback UI for failed videos */}
                            <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-xl flex-col items-center justify-center hidden">
                              <div className="text-red-500 text-sm mb-2">Video unavailable</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                                {media.media_type}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } else if (media.media_type === 'voice') {
                      return (
                        <div key={index} className="relative">
                          <AudioPlayer 
                            src={mediaUrl}
                            title={`Audio Message ${index + 1}`}
                            className="w-full"
                          />
                        </div>
                      );
                    } else if (media.media_type === 'pdf') {
                      return (
                        <div key={index} className="relative">
                          <div 
                            className="w-full h-48 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-800 dark:to-red-900 rounded-xl flex flex-col items-center justify-center p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => window.open(mediaUrl, '_blank')}
                            style={{
                              width: "100%",
                              height: "192px",
                              minHeight: "192px"
                            }}
                          >
                            <div className="w-16 h-16 bg-red-500 rounded-lg flex items-center justify-center mb-3">
                              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">PDF Document</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Click to open</div>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div 
                          key={index} 
                          className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center"
                          style={{
                            width: "100%",
                            height: "192px",
                            minHeight: "192px"
                          }}
                        >
                          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                            {media.media_type}
                          </span>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Footer Section with modern action buttons */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center space-x-2 text-sm transition-all duration-200 group ${
                  isLiked 
                    ? 'text-red-500 dark:text-red-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                } ${isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isLiked ? (
                  <HeartSolidIcon className="w-5 h-5 text-red-500 dark:text-red-400 scale-110 transition-all duration-200" />
                ) : (
                  <HeartIcon className="w-5 h-5 hover:scale-110 transition-all duration-200" />
                )}
                <span className="font-medium">
                  {likeCount > 0 ? `${likeCount} Like${likeCount !== 1 ? 's' : ''}` : 'Like'}
                </span>
              </button>
              <button 
                onClick={() => onViewComments && onViewComments(post)}
                className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
              >
                <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Comment</span>
              </button>
            </div>
            
            {showRoomInfo && (
              <button 
                onClick={handleViewRoom}
                className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <Eye size={16} />
                <span className="font-medium">View Room</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleModalBackdropClick}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80 hover:scale-110 transition-all duration-200"
            >
              <X size={20} />
            </button>

            {/* Loading Spinner */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}

            {/* Modal Image */}
            <img
              src={selectedImage}
              alt="Full size preview"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-all duration-300"
              style={{ opacity: imageLoading ? 0 : 1 }}
              onLoad={handleImageLoad}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* View Room Modal */}
      {showViewRoomModal && (
        <ViewRoomModal
          room={post.room}
          isOpen={showViewRoomModal}
          onClose={() => setShowViewRoomModal(false)}
          onSuccess={handleViewRoomSuccess}
          onError={handleViewRoomError}
        />
      )}

      {/* Report Post Modal */}
      {showReportModal && (
        <ReportPostModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          post={post}
          onReportSuccess={handleReportSuccess}
        />
      )}
    </>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard; 