import React, { useState, useEffect } from 'react';
import { X, Upload, Star, Image, FileText, Video, Mic, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CreatePostModal = ({ isOpen, onClose, onSubmit, room, userRole, editMode = false, existingPost = null }) => {
  const { user, smartRefreshUser, isUserDataStale } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    visibility: 'private',
    is_featured: false,
    scheduled_at: ''
  });
  const [media, setMedia] = useState([]);
  const [mediaTypes, setMediaTypes] = useState([]);
  const [deleteMedia, setDeleteMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  // Auto-refresh user data when modal opens if data is stale
  useEffect(() => {
    const autoRefreshUserData = async () => {
      if (isOpen && isUserDataStale()) {
        setAutoRefreshing(true);
        try {await smartRefreshUser();} catch (error) {} finally {
          setAutoRefreshing(false);
        }
      }
    };

    autoRefreshUserData();
  }, [isOpen, isUserDataStale, smartRefreshUser]);

  // Initialize form with existing post data when in edit mode
  useEffect(() => {
    if (editMode && existingPost) {
      // Convert scheduled_at from UTC to local datetime-local format if it exists
      let scheduledAt = '';
      if (existingPost.scheduled_at) {
        const date = new Date(existingPost.scheduled_at);
        // Convert to local datetime-local format (YYYY-MM-DDTHH:MM)
        scheduledAt = date.toISOString().slice(0, 16);
      }
      
      setFormData({
        title: existingPost.title || '',
        content: existingPost.content || '',
        visibility: existingPost.visibility || 'private',
        is_featured: existingPost.is_featured || false,
        scheduled_at: scheduledAt
      });
      // Note: existing media is displayed separately, new media uploads are additional
      setMedia([]);
      setMediaTypes([]);
      setDeleteMedia([]);
    } else {
      // Reset form for create mode
      setFormData({
        title: '',
        content: '',
        visibility: 'private',
        is_featured: false,
        scheduled_at: ''
      });
      setMedia([]);
      setMediaTypes([]);
      setDeleteMedia([]);
    }
  }, [editMode, existingPost, isOpen]);

  // Debug: Log user data to help diagnose subscription level issues
  console.log('User data debug:', {
    user_id: user?.id,
    user_name: user?.name,
    room_owner_id: room?.owner_id,
    isDataStale: isUserDataStale(),
    autoRefreshing,
    full_user_object: user
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await onSubmit({
        ...formData,
        media,
        mediaTypes,
        ...(editMode && { deleteMedia })
      });

      if (result.success) {
        // Reset form
        setFormData({
          title: '',
          content: '',
          visibility: 'private',
          is_featured: false,
          scheduled_at: ''
        });
        setMedia([]);
        setMediaTypes([]);
        onClose();
      } else {
        // Show more specific error messages
        const errorMessage = result.error || 'Failed to create post';
        setError(errorMessage);
        
        // If it's a scheduling error, scroll to the schedule field
        if (errorMessage.toLowerCase().includes('scheduled')) {
          setTimeout(() => {
            const scheduleField = document.querySelector('input[type="datetime-local"]');
            if (scheduleField) {
              scheduleField.scrollIntoView({ behavior: 'smooth', block: 'center' });
              scheduleField.focus();
            }
          }, 100);
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to ' + (editMode ? 'update' : 'create') + ' post');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + media.length > 10) {
      setError('Maximum 10 media files allowed');
      return;
    }

    const newMedia = [...media];
    const newMediaTypes = [...mediaTypes];

    files.forEach(file => {
      newMedia.push(file);
      
      // Determine media type based on file type
      if (file.type.startsWith('image/')) {
        newMediaTypes.push('image');
      } else if (file.type.startsWith('video/')) {
        newMediaTypes.push('video');
      } else if (file.type.startsWith('audio/')) {
        newMediaTypes.push('voice');
      } else if (file.type === 'application/pdf') {
        newMediaTypes.push('pdf');
      } else {
        newMediaTypes.push('pdf'); // Default to pdf for other file types
      }
    });

    setMedia(newMedia);
    setMediaTypes(newMediaTypes);
  };

  const removeMedia = (index) => {
    const newMedia = media.filter((_, i) => i !== index);
    const newMediaTypes = mediaTypes.filter((_, i) => i !== index);
    setMedia(newMedia);
    setMediaTypes(newMediaTypes);
  };

  const removeExistingMedia = (mediaId) => {
    setDeleteMedia(prev => [...prev, mediaId]);
  };

  const getMediaIcon = (type) => {
    switch (type) {
      case 'image': return <Image size={16} />;
      case 'video': return <Video size={16} />;
      case 'voice': return <Mic size={16} />;
      case 'pdf': return <FileText size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const canCreatePublic = userRole === 'owner' && user?.subscription_level && 
                         ['silver', 'gold'].includes(user.subscription_level);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editMode ? 'Edit Post' : 'Create New Post'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Post Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter post title..."
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Write your post content..."
                required
              />
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Media Files (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf"
                  onChange={handleMediaUpload}
                  className="hidden"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload media files
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Max 10 files, 50MB each
                  </span>
                </label>
              </div>

              {/* Media Preview */}
              {media.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">New Files:</h4>
                  {media.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="flex items-center space-x-2">
                        {getMediaIcon(mediaTypes[index])}
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Existing Media (Edit Mode) */}
              {editMode && existingPost?.media && existingPost.media.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Files:</h4>
                  {existingPost.media.filter(media => !deleteMedia.includes(media.id)).map((media, index) => (
                    <div key={media.id} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <div className="flex items-center space-x-2">
                        {getMediaIcon(media.media_type)}
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {media.file_path.split('/').pop()}
                        </span>
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          (existing)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingMedia(media.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Mark for deletion"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({...formData, visibility: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">
                    Private (Room members only)
                  </option>
                  {canCreatePublic && (
                    <option value="public">
                      Public (Visible to everyone)
                    </option>
                  )}
                </select>
                
                {/* 24-hour policy notice for public posts */}
                {formData.visibility === 'public' && (
                  <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Clock size={16} className="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">
                          24-Hour Visibility Policy
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                          Public posts will automatically become private after 24 hours and disappear from the public feed. 
                          They'll remain visible to room members in your room.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {!canCreatePublic && userRole === 'owner' && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    {autoRefreshing ? (
                      <div className="flex items-center text-sm text-blue-800 dark:text-blue-300">
                        <RefreshCw size={14} className="mr-2 animate-spin" />
                        Updating account data...
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                          🔒 Public posts are available for Silver and Gold subscribers
                        </p>
                        {isUserDataStale() && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            💡 Account data will auto-refresh when needed
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Scheduled At */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Schedule (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    
                    // Client-side validation: check if selected time is in the future
                    if (value) {
                      const selectedTime = new Date(value);
                      const currentTime = new Date();
                      
                      if (selectedTime <= currentTime) {
                        setError('Please select a future date and time (Beirut timezone)');
                        return;
                      } else {
                        // Clear error if time is valid
                        if (error && error.toLowerCase().includes('future date')) {
                          setError('');
                        }
                      }
                    }
                    
                    setFormData({...formData, scheduled_at: value});
                  }}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} // 1 minute from now
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Schedule this post to be published at a specific date and time (Beirut timezone)"
                />
                {formData.scheduled_at && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      📅 <strong>Scheduled:</strong> {new Date(formData.scheduled_at).toLocaleString('en-US', {
                        timeZone: 'Asia/Beirut',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short'
                      })}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      This post will be automatically published at the scheduled time (Beirut time).
                    </p>
                  </div>
                )}
                {!formData.scheduled_at && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty to publish immediately (times are in Beirut timezone)
                  </p>
                )}
              </div>
            </div>

            {/* Featured Toggle */}
            {userRole === 'owner' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                  <Star size={16} className="mr-1" />
                  Mark as featured post
                </label>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 
                  (editMode ? 'Updating...' : (formData.scheduled_at ? 'Scheduling...' : 'Creating...')) : 
                  (editMode ? 'Update Post' : (formData.scheduled_at ? 'Schedule Post' : 'Create Post'))
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal; 