import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Filter, Search, MessageSquare } from 'lucide-react';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import CommentsModal from './CommentsModal';
import apiService from '../../services/apiService';
import { buildApiUrl } from '../../config';

const RoomPosts = ({ roomId, room, userRole }) => {
  const { token, user: currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('all');

  useEffect(() => {
    // Debug environment variables
    console.log('Environment debug:', {
      location: window.location.href
    });
    
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, currentPage]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);const endpoint = `/rooms/${roomId}/posts?page=${currentPage}`;const response = await apiService.get(endpoint);if (response.success) {
        setPosts(response.posts);
        setError(null);
      } else {
        console.error('API returned success=false:', response);
        setError(response.message || 'Failed to fetch posts');
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      console.error('Error response:', err.response);
      console.error('Error request:', err.request);
      
      if (err.response) {
        // Server responded with error status
        const errorMessage = err.response.data?.message || 
                           err.response.data?.error || 
                           `Server error: ${err.response.status}`;
        setError(errorMessage);
      } else if (err.request) {
        // Request was made but no response received
        setError('Network error: Could not connect to server');
      } else {
        // Something else happened
        setError('Request error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      // Debug: Log the scheduled_at value being sent
      if (postData.scheduled_at) {
        const scheduledDate = new Date(postData.scheduled_at);
        const currentDate = new Date();
        console.log('Scheduled post debug:', {
          current_time_beirut: currentDate.toLocaleString('en-US', {
            timeZone: 'Asia/Beirut',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          }),
          is_future: scheduledDate > currentDate,
          minutes_until: Math.round((scheduledDate - currentDate) / 60000)
        });
      }

      const formData = new FormData();
      formData.append('title', postData.title);
      formData.append('content', postData.content);
      formData.append('visibility', postData.visibility);
      formData.append('is_featured', postData.is_featured ? '1' : '0');
      
      if (postData.scheduled_at) {
        formData.append('scheduled_at', postData.scheduled_at);
      }

      // Add media files
      if (postData.media && postData.media.length > 0) {
        postData.media.forEach((file, index) => {
          formData.append(`media[${index}]`, file);
          formData.append(`media_types[${index}]`, postData.mediaTypes[index]);
        });
      }

      const response = await apiService.post(
        `/rooms/${roomId}/posts`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Debug: Log the complete response to verify avatar data
      if (process.env.NODE_ENV === 'development') {
        console.log('Create post response:', response);
      }

      if (response.success) {
        setShowCreateModal(false);
        
        // Use the returned post data directly instead of refetching all posts
        // This ensures immediate display with complete author data including avatar
        if (response.post) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Post author debug:', {
              authorId: response.post.author?.id,
              currentUserAvatar: currentUser?.avatar,
              avatarMatch: response.post.author?.avatar === currentUser?.avatar,
              currentUserIsAuthor: response.post.author?.id === currentUser?.id
            });
          }
          
          setPosts(prevPosts => ({
            ...prevPosts,
            data: [response.post, ...(prevPosts.data || [])],
            total: (prevPosts.total || 0) + 1
          }));
        } else {// Fallback to refresh if no post data returned
          fetchPosts();
        }
        
        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err) {
      console.error('Error creating post:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Failed to create post' 
      };
    }
  };

  const handleUpdatePost = async (postData) => {
    try {
      const formData = new FormData();
      formData.append('title', postData.title);
      formData.append('content', postData.content);
      formData.append('visibility', postData.visibility);
      formData.append('is_featured', postData.is_featured ? '1' : '0');
      formData.append('_method', 'PUT'); // Laravel method override
      
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

      const response = await apiService.post(
        `/rooms/${roomId}/posts/${editingPost.id}`,
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
          setPosts(prevPosts => ({
            ...prevPosts,
            data: (prevPosts.data || []).map(post => 
              post.id === response.post.id ? response.post : post
            )
          }));
        } else {
          // Fallback to refresh if no post data returned
          fetchPosts();
        }
        
        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err) {
      console.error('Error updating post:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Failed to update post' 
      };
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowEditModal(true);
  };

  const handleDeletePost = async (post) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const response = await apiService.delete(`/rooms/${roomId}/posts/${post.id}`);

      if (response.success) {
        fetchPosts(); // Refresh posts
      } else {
        alert('Failed to delete post');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    }
  };

  const handleViewComments = (post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  const filteredPosts = posts.data?.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterVisibility === 'all' || post.visibility === filterVisibility;
    
    return matchesSearch && matchesFilter;
  }) || [];

  const canCreatePost = userRole === 'owner' || userRole === 'moderator';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6">
              {/* Header Section - matches PostCard layout */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {/* Avatar skeleton */}
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    
                    {/* User info skeleton */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-20"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu button skeleton */}
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>

                {/* Content skeleton - matches PostCard content */}
                <div className="space-y-4">
                  {/* Title skeleton */}
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                  
                  {/* Content skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                  </div>

                  {/* Media skeleton - matches PostCard media grid */}
                  {i % 2 === 0 && (
                    <div className="mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2].map((j) => (
                          <div 
                            key={j} 
                            className="w-full h-48 bg-gray-300 dark:bg-gray-600 rounded-xl"
                            style={{
                              width: "100%",
                              height: "192px",
                              minHeight: "192px"
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer skeleton - matches PostCard footer */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Like button skeleton */}
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-8"></div>
                    </div>
                    
                    {/* Comments button skeleton */}
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                  </div>
                  
                  {/* Room link skeleton */}
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error</h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Room Posts
            {posts.total > 0 && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                ({posts.total} {posts.total === 1 ? 'post' : 'posts'})
              </span>
            )}
          </h2>
          {posts.total === 0 && !loading && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                📝 No posts available right now.
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                There might be scheduled posts that will appear when their scheduled time arrives.
              </p>
            </div>
          )}
        </div>
        
        {canCreatePost && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Create Post
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter size={18} className="text-gray-400" />
          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Posts</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No posts found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || filterVisibility !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : canCreatePost 
                ? 'Be the first to create a post in this room!'
                : 'No posts have been created in this room yet.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              showRoomInfo={false}
              onViewComments={handleViewComments}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {posts.last_page > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {posts.last_page}
            </span>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === posts.last_page}
              className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
          room={room}
          userRole={userRole}
        />
      )}

      {showEditModal && editingPost && (
        <CreatePostModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingPost(null);
          }}
          onSubmit={handleUpdatePost}
          room={room}
          userRole={userRole}
          editMode={true}
          existingPost={editingPost}
        />
      )}

      {showCommentsModal && selectedPost && (
        <CommentsModal
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          post={selectedPost}
          roomId={roomId}
        />
      )}
    </div>
  );
};

export default RoomPosts; 