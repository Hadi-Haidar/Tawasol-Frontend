import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Search, Filter, Globe, TrendingUp } from 'lucide-react';
import PostCard from '../components/posts/PostCard';
import CommentsModal from '../components/posts/CommentsModal';
import CreatePostModal from '../components/posts/CreatePostModal';
import apiService from '../services/apiService';

const PostsPage = () => {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  
  // Performance optimizations
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const cacheRef = useRef(new Map()); // Simple cache for posts
  const lastFetchTime = useRef(null);

  // Memoized fetch function with caching
  const fetchPublicPosts = useCallback(async (isRefresh = false) => {
    try {
      const cacheKey = `posts-${currentPage}`;
      const now = Date.now();
      
      // Use cache if data is fresh (less than 30 seconds old) and not refreshing
      if (!isRefresh && cacheRef.current.has(cacheKey) && lastFetchTime.current && (now - lastFetchTime.current) < 30000) {
        const cachedData = cacheRef.current.get(cacheKey);
        if (currentPage === 1) {
          setPosts(cachedData.posts);
        } else {
          setPosts(prev => [...prev, ...cachedData.posts]);
        }
        setHasMorePages(cachedData.hasMore);
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await apiService.get(`/public-posts?page=${currentPage}`);
      
      if (response.success) {
        const newPosts = response.posts.data;
        
        // Cache the response
        cacheRef.current.set(cacheKey, {
          posts: newPosts,
          hasMore: response.posts.current_page < response.posts.last_page
        });
        lastFetchTime.current = now;
        
        // Update posts state
        if (currentPage === 1 || isRefresh) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
        
        setHasMorePages(response.posts.current_page < response.posts.last_page);
        setError(null);
      } else {
        setError('Failed to fetch posts');
      }
    } catch (err) {
      console.error('Error fetching public posts:', err);
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setInitialLoad(false);
    }
  }, [currentPage]);

  // Initial load and page changes
  useEffect(() => {
    fetchPublicPosts();
  }, [fetchPublicPosts]);

  // Refresh function for instant updates
  const handleRefresh = useCallback(async () => {
    cacheRef.current.clear(); // Clear cache
    setCurrentPage(1);
    await fetchPublicPosts(true);
  }, [fetchPublicPosts]);



  const handleViewComments = useCallback((post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  }, []);

  const handleEditPost = useCallback((post) => {
    setEditingPost(post);
    setShowEditModal(true);
  }, []);

  const handleDeletePost = useCallback(async (post) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.delete(`/rooms/${post.room_id}/posts/${post.id}`);

      if (response.success) {
        // Remove post from state immediately for instant feedback
        setPosts(prevPosts => prevPosts.filter(p => p.id !== post.id));
        // Clear cache to ensure fresh data on next load
        cacheRef.current.clear();
      } else {
        alert('Failed to delete post: ' + (response.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    }
  }, []);

  const handleUpdatePost = async (postData) => {
    if (!editingPost) return { success: false, error: 'No post selected for editing' };

    try {
      const formData = new FormData();
      formData.append('title', postData.title);
      formData.append('content', postData.content);
      formData.append('visibility', postData.visibility);
      formData.append('is_featured', postData.is_featured ? '1' : '0');
      formData.append('_method', 'PUT'); // Laravel method override for file uploads
      
      if (postData.scheduled_at) {
        formData.append('scheduled_at', postData.scheduled_at);
      }

      // Add new media files if any
      if (postData.media && postData.media.length > 0) {
        postData.media.forEach((file, index) => {
          formData.append(`media[${index}]`, file);
          formData.append(`media_types[${index}]`, postData.mediaTypes[index]);
        });
      }

      // Handle media deletions
      if (postData.deleteMedia && postData.deleteMedia.length > 0) {
        postData.deleteMedia.forEach((mediaId, index) => {
          formData.append(`delete_media[${index}]`, mediaId);
        });
      }

      // Use POST with _method=PUT for Laravel file upload compatibility
      const response = await apiService.post(
        `/rooms/${editingPost.room_id}/posts/${editingPost.id}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.success) {
        setShowEditModal(false);
        setEditingPost(null);
        
        // Use the returned post data directly instead of refetching all posts
        // This ensures immediate display with complete updated author data including avatar
        if (response.post) {
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === response.post.id ? response.post : post
            )
          );
        } else {
          // Fallback to refresh if no post data returned
          fetchPublicPosts();
        }
        
        return { success: true };
      } else {
        return { success: false, error: response.message || 'Failed to update post' };
      }
    } catch (err) {
      console.error('Error updating post:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Failed to update post' 
      };
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMorePages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [loading, hasMorePages]);

  // Update a post in the posts array (used after liking/unliking)
  const updatePost = useCallback((updatedPost) => {
    setPosts(currentPosts => 
      currentPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
    // Clear cache to ensure updates are reflected
    cacheRef.current.clear();
  }, []);

  // Memoized filtered posts for better performance
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = !searchTerm || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || 
        (filterType === 'featured' && post.is_featured);
      
      return matchesSearch && matchesFilter;
    });
  }, [posts, searchTerm, filterType]);

  // Only show full loading skeleton on initial load
  if (initialLoad && loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="text-center space-y-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto animate-pulse"></div>
            </div>
            
            {/* Search Bar Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            </div>
            
            {/* Posts Skeleton */}
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Oops! Something went wrong</h3>
            <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
            <button
              onClick={fetchPublicPosts}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header Section with Refresh */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Globe size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Public Posts
            </h1>
            {/* {refreshing && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            )} */}
          </div>
          <div className="flex items-center justify-center space-x-4">
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
              Discover amazing content from communities around the world. Connect, engage, and explore!
            </p>
            {/* <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button> */}
          </div>
        </div>



        {/* Enhanced Search and Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar with improved design */}
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search posts by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Filter Dropdown */}
            <div className="flex items-center space-x-3">
              <Filter size={20} className="text-gray-400 dark:text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-[140px]"
              >
                <option value="all">All Posts</option>
                <option value="featured">Featured Only</option>
              </select>
            </div>
          </div>
          
          {/* Search Results Count */}
          {searchTerm && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredPosts.length > 0 
                  ? `Found ${filteredPosts.length} ${filteredPosts.length === 1 ? 'post' : 'posts'} with title matching "${searchTerm}"`
                  : `No posts found with title matching "${searchTerm}"`
                }
              </p>
            </div>
          )}
        </div>

        {/* Posts List with space-y-6 spacing */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              {searchTerm ? (
                <Search size={40} className="text-gray-400 dark:text-gray-500" />
              ) : (
                <MessageSquare size={40} className="text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {searchTerm ? 'No posts found' : 'No posts available'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your title search terms or browse all posts.'
                : 'There are no public posts to display at the moment. Check back later for new content!'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                showRoomInfo={true}
                showPublicTimer={true}
                onViewComments={handleViewComments}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
                onPostUpdate={updatePost}
                priority={index < 2} // First 2 posts load with priority
              />
            ))}
          </div>
        )}

        {/* Enhanced Pagination with Loading State */}
        {(hasMorePages || loading) && !initialLoad && (
          <div className="mt-12 flex justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
              <div className="flex items-center space-x-2">
                {loading ? (
                  <div className="flex items-center space-x-2 px-4 py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading more posts...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleLoadMore}
                    disabled={!hasMorePages || loading}
                    className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Load More Posts
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comments Modal */}
        {showCommentsModal && selectedPost && (
          <CommentsModal
            isOpen={showCommentsModal}
            onClose={() => setShowCommentsModal(false)}
            post={selectedPost}
            roomId={selectedPost.room_id}
          />
        )}

        {/* Edit Post Modal */}
        {showEditModal && editingPost && (
          <CreatePostModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingPost(null);
            }}
            onSubmit={handleUpdatePost}
            room={editingPost.room}
            userRole="owner"
            editMode={true}
            existingPost={editingPost}
          />
        )}
      </div>
    </div>
  );
};

export default PostsPage; 