import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  UsersIcon,
  PhotoIcon,
  DocumentIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import websocketService from '../../../services/websocket';
import chatApiService from '../../../services/chatApi';
import Avatar from '../../common/Avatar';
import RoomMembersModal from '../RoomMembersModal';
import OnlineMembers from '../OnlineMembers';
import UserProfileModal from '../UserProfileModal';
import ImageModal from '../../common/ImageModal';
import VoiceMessage from '../../audio/VoiceMessage';

const RoomChat = ({ room, user, isMember, isOwner, userRole }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Helper function to determine message author's role
  const getMessageAuthorRole = (message, room) => {
    if (room?.owner_id === message.user_id) {
      return 'owner';
    }
    
    const membership = room?.members?.find(
      member => (member.user?.id || member.user_id) === message.user_id
    );
    
    return membership?.role || 'member';
  };

  // Helper function to check if user can interact with a message (edit/delete)
  const canUserInteractWithMessage = (message, user, userRole, room) => {
    // Users can always interact with their own messages
    if (message.user_id === user?.id) {
      return true;
    }

    // Only owners and moderators can interact with other people's messages
    if (!['owner', 'moderator'].includes(userRole)) {
      return false;
    }

    // Owners can interact with any message
    if (userRole === 'owner') {
      return true;
    }

    // Moderators cannot interact with owner's messages
    const messageAuthorRole = getMessageAuthorRole(message, room);
    if (userRole === 'moderator' && messageAuthorRole === 'owner') {
      return false;
    }

    // Moderators can interact with messages from members and other moderators
    return true;
  };

  // Helper function to check if user can delete a specific message
  const canUserDeleteMessage = (message, user, userRole, room) => {
    return canUserInteractWithMessage(message, user, userRole, room);
  };
  const [loading, setLoading] = useState(true);
  // const [onlineUsers, setOnlineUsers] = useState([]); // Removed: Online users functionality
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  
  // Edit/Delete message states
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  
  // Voice recording states - WhatsApp style
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [audioPlayStates, setAudioPlayStates] = useState({});
  
  // Video recording states
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [videoRecordingTime, setVideoRecordingTime] = useState(0);
  const [videoMediaRecorder, setVideoMediaRecorder] = useState(null);
  const [videoStream, setVideoStream] = useState(null);
  
  // Image modal states
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Room members modal state
  const [showMembersModal, setShowMembersModal] = useState(false);
  
  // User profile modal state
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  
  // Smart scroll states - WhatsApp behavior
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  
  // File attachment states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviewMode, setFilePreviewMode] = useState(null); // 'image', 'video', 'document'
  
  // Image modal states for viewing images
  const [viewingImage, setViewingImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const editInputRef = useRef(null);
  const isInitialMountRef = useRef(true);
  const hasFocusedRef = useRef(false);
  const hasScrolledRef = useRef(false);

  // Edit message functions
  const startEditMessage = (message) => {
    setEditingMessageId(message.id);
    setEditMessageText(message.message || '');
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    }, 100);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditMessageText('');
  };

  const saveEditMessage = async () => {
    if (!editMessageText.trim() || !editingMessageId) return;

    try {
      const response = await chatApiService.editMessage(editingMessageId, editMessageText.trim());
      
      // Update message in local state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === editingMessageId 
                            ? { ...msg, message: editMessageText.trim(), updated_at: new Date().toISOString() }
            : msg
        )
      );
      
      // 📦 PERFORMANCE: Clear cache when editing message
      const cacheKey = `messages_room_${room.id}`;
      sessionStorage.removeItem(cacheKey);
      
      setEditingMessageId(null);
      setEditMessageText('');} catch (error) {
      console.error('❌ Failed to edit message:', error);
      alert('Failed to edit message. Please try again.');
    }
  };

  // Delete message functions
  const startDeleteMessage = (messageId) => {
    setDeletingMessageId(messageId);
    setShowDeleteConfirm(true);
  };

  const cancelDeleteMessage = () => {
    setDeletingMessageId(null);
    setShowDeleteConfirm(false);
  };

  const confirmDeleteMessage = async () => {
    if (!deletingMessageId) return;

    try {
      await chatApiService.deleteMessage(deletingMessageId);
      
      // Remove message from local state
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== deletingMessageId)
      );
      
      // 📦 PERFORMANCE: Clear cache when deleting message
      const cacheKey = `messages_room_${room.id}`;
      sessionStorage.removeItem(cacheKey);
      
      setDeletingMessageId(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      // Handle 404 gracefully - message might already be deleted
      if (error.response?.status === 404) {
        // Message doesn't exist, remove from local state anyway
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== deletingMessageId)
        );
        setDeletingMessageId(null);
        setShowDeleteConfirm(false);
        return;
      }
      
      console.error('❌ Failed to delete message:', error);
      // Only show alert for non-404 errors
      if (error.response?.status !== 404) {
      alert('Failed to delete message. Please try again.');
      }
    }
  };

  // Utility functions
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? "smooth" : "auto",
        block: "end",
        inline: "nearest"
      });
    }
  };

  const scrollToBottomInstant = () => {
    scrollToBottom(false);
  };

  // Smart scroll detection - WhatsApp-like behavior
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    
    const container = messagesContainerRef.current;
    const threshold = 100; // Optimized threshold
    
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < threshold;
  };

  // Detect manual scroll and update state
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const currentScrollTop = container.scrollTop;
    const nearBottom = isNearBottom();
    
    // Detect if user manually scrolled up
    if (currentScrollTop < lastScrollTop && !nearBottom) {
      setUserScrolledUp(true);
    }
    
    // Reset userScrolledUp when user is back near bottom
    if (nearBottom && userScrolledUp) {
      setUserScrolledUp(false);
    }
    
    setLastScrollTop(currentScrollTop);
  };

  // WhatsApp-like smart auto-scroll - only scroll if user hasn't manually scrolled up
  const smartAutoScroll = (delay = 0, isOwnMessage = false) => {
    setTimeout(() => {
      if (!messagesContainerRef.current) return;
      
      const container = messagesContainerRef.current;
      const nearBottom = isNearBottom();
      
      // Always scroll for user's own messages OR if user is near bottom and hasn't scrolled up
      if (isOwnMessage || (nearBottom && !userScrolledUp)) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
        setUserScrolledUp(false); // Reset scroll state
      }
    }, delay);
  };

  // Enhanced WhatsApp-like smooth scrolling with better calculations
  const scrollToBottomSmooth = (delay = 0) => {
    setTimeout(() => {
      if (messagesEndRef.current && messagesContainerRef.current) {
        // Force scroll to the very bottom to ensure last message is visible
        const container = messagesContainerRef.current;
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, delay);
  };

  // Force scroll to absolute bottom (for user's own messages)
  const scrollToBottomForce = (delay = 0) => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        // Scroll to the absolute bottom with extra space
        container.scrollTo({
          top: container.scrollHeight + 100, // Extra buffer
          behavior: 'smooth'
        });
      }
    }, delay);
  };

  // Auto-scroll only if user was near bottom (WhatsApp behavior)
  const autoScrollIfNearBottom = (delay = 0) => {
    const wasNearBottom = isNearBottom();
    if (wasNearBottom) {
      scrollToBottomForce(delay);
    }
  };

  // Always scroll for user's own messages (WhatsApp behavior)
  const scrollForOwnMessage = (delay = 50) => {
    scrollToBottomForce(delay);
  };

  // WhatsApp-like auto-focus function
  const focusInputAfterSend = (delay = 100) => {
    setTimeout(() => {
      // Only focus if conditions are right for typing
      if (inputRef.current && 
          !isRecording && 
          !recordedAudio && 
          !isUploading &&
          (isMember || isOwner)) {
        try {
          inputRef.current.focus();
          // Ensure cursor is at the end of any existing text
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        } catch (error) {
          // Silently handle any focus errors
        }
      }
    }, delay);
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate waveform for voice messages
  const generateWaveform = (length = 25) => {
    return Array.from({ length }, () => Math.random() * 0.8 + 0.2);
  };

  // Audio playback management
  const toggleAudioPlayback = (messageId, audioElement) => {
    // Pause all other audio elements
    Object.keys(audioPlayStates).forEach(id => {
      if (id !== messageId && audioPlayStates[id].isPlaying) {
        const otherAudio = document.getElementById(`audio-${id}`);
        if (otherAudio) {
          otherAudio.pause();
          setAudioPlayStates(prev => ({
            ...prev,
            [id]: { ...prev[id], isPlaying: false }
          }));
        }
      }
    });

    const isCurrentlyPlaying = audioPlayStates[messageId]?.isPlaying || false;
    
    if (isCurrentlyPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    
    setAudioPlayStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        isPlaying: !isCurrentlyPlaying
      }
    }));
  };

  const handleAudioTimeUpdate = (messageId, audioElement) => {
    const duration = audioElement.duration || 0;
    const currentTime = audioElement.currentTime || 0;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    setAudioPlayStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        progress,
        currentTime,
        duration
      }
    }));
  };

  const handleAudioEnded = (messageId) => {
    setAudioPlayStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        isPlaying: false,
        progress: 0,
        currentTime: 0
      }
    }));
  };

  // Voice recording functions - WhatsApp style
  const startRecording = async () => {
    try {
      // Clean up any existing states first
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
      
      if (mediaRecorder) {
        setMediaRecorder(null);
      }const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });setAudioStream(stream);
      
      // Check if browser supports the desired format
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose
          }
        }
      }const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      
      const audioChunks = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);}
      };
      
      recorder.onstop = () => {const audioBlob = new Blob(audioChunks, { type: mimeType || 'audio/webm' });setRecordedAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      };
      
      recorder.onerror = (event) => {
        console.error('Recording error:', event.error);
        alert('Recording error: ' + event.error);
        cancelRecording();
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);// Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert('Could not access microphone: ' + error.message);
      }
      
      // Clean up on error
      cancelRecording();
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    
    setIsRecording(false);
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Clean up audio stream
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    
    // Reset media recorder
    setMediaRecorder(null);
    
    // Auto-focus input after stopping recording (WhatsApp behavior)
    focusInputAfterSend(200);
  };
  
  const cancelRecording = () => {
    // Stop recording if active
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    
    // Clean up all states
    setIsRecording(false);
    setRecordedAudio(null);
    setRecordingTime(0);
    setMediaRecorder(null);
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    
    // Auto-focus input after canceling recording (WhatsApp behavior)
    focusInputAfterSend(100);
  };
  
  const sendVoiceMessage = async () => {
    if (!recordedAudio) return;
    
    try {
      setIsUploading(true);
      
      // Create a more robust FormData
      const formData = new FormData();
      
      // Create a proper file name with timestamp
      const fileName = `voice-${Date.now()}.webm`;
      
      // Append the audio blob as a file
      formData.append('file', recordedAudio, fileName);
      formData.append('type', 'voice');
      formData.append('message', `Voice message (${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')})`);const response = await chatApiService.sendMessageWithFile(room.id, formData);// Clear recorded audio
      setRecordedAudio(null);
      setRecordingTime(0);
      
      // 📦 PERFORMANCE: Clear cache when sending voice message
      const cacheKey = `messages_room_${room.id}`;
      sessionStorage.removeItem(cacheKey);
      
      // WhatsApp-like auto-focus after sending (immediate)
      focusInputAfterSend(50);
      
      // Always scroll for user's own voice message (WhatsApp style)
      smartAutoScroll(50, true);
      
    } catch (error) {
      console.error('Failed to send voice message:', error);
      
      // More detailed error handling
      if (error.response) {
        console.error('Response error:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        
        // Show specific validation errors
        if (error.response.status === 422 && error.response.data.errors) {
          const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
          alert(`Validation error: ${errorMessages}`);
        } else {
          alert(`Failed to send voice message: ${error.response.data.error || error.response.data.message || 'Server error'}`);
        }
      } else if (error.request) {
        console.error('Request error:', error.request);
        alert('Failed to send voice message: Network error. Please check your connection.');
      } else {
        console.error('Error:', error.message);
        alert('Failed to send voice message: Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // File attachment functions
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      
      // Determine preview mode based on file type
      const firstFile = files[0];
      if (firstFile.type.startsWith('image/')) {
        setFilePreviewMode('image');
      } else if (firstFile.type.startsWith('video/')) {
        setFilePreviewMode('video');
      } else if (firstFile.type.startsWith('audio/')) {
        setFilePreviewMode('voice');
      } else {
        // Handle documents
        setFilePreviewMode('document');
      }
    }
    
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const sendSelectedFiles = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Determine file type
        let type = 'document';
        if (file.type.startsWith('image/')) {
          type = 'image';
        } else if (file.type.startsWith('video/')) {
          type = 'video';
        } else if (file.type.startsWith('audio/')) {
          type = 'voice';
        }
        
        formData.append('type', type);
        
        // Add a descriptive message based on file type
        let message = '';
        if (type === 'document') {
          const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
          message = `Document: ${file.name} (${sizeInMB} MB)`;
        } else {
          message = `${type} file: ${file.name}`;
        }
        formData.append('message', message);

        await chatApiService.sendMessageWithFile(room.id, formData);
      }

      // Clear selected files
      setSelectedFiles([]);
      setFilePreviewMode(null);
      
      // 📦 PERFORMANCE: Clear cache when sending files
      const cacheKey = `messages_room_${room.id}`;
      sessionStorage.removeItem(cacheKey);
      
      // Auto-focus and scroll
      focusInputAfterSend(100);
      smartAutoScroll(50, true);
      
    } catch (error) {
      console.error('Failed to send files:', error);
      
      // Show more specific error message
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to send files. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const cancelFileSelection = () => {
    setSelectedFiles([]);
    setFilePreviewMode(null);
    focusInputAfterSend(100);
  };

  // Image modal functions
  const openImageModal = (imageUrl) => {
    setViewingImage(imageUrl);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setViewingImage(null);
    setImageModalOpen(false);
  };

  // 🚀 PERFORMANCE: Essential chat functions with caching
  const loadMessages = useCallback(async (pageNum = 1, append = false) => {
    if (!room?.id) return;
    
    try {
      setLoading(true);
      
      // 📦 PERFORMANCE: Check sessionStorage cache first (only for initial page)
      if (pageNum === 1 && !append) {
        const cacheKey = `messages_room_${room.id}`;
        const cached = sessionStorage.getItem(cacheKey);
        
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            // Cache valid for 30 seconds
            if (Date.now() - timestamp < 30000) {
              setMessages(data);
              setLoading(false);
              setTimeout(scrollToBottomInstant, 100);
              return;
            }
          } catch (e) {
            // Invalid cache, proceed with fetch
            sessionStorage.removeItem(cacheKey);
          }
        }
      }
      
      const response = await chatApiService.getMessages(room.id, pageNum);
      const newMessages = response.data || [];
      
      // Filter out invalid messages
      const validMessages = newMessages.filter(msg => msg && msg.id);
      
      if (append) {
        setMessages(prev => [...validMessages.reverse(), ...prev]);
      } else {
        const reversedMessages = validMessages.reverse();
        setMessages(reversedMessages);
        
        // 📦 PERFORMANCE: Cache the initial messages
        if (pageNum === 1) {
          const cacheKey = `messages_room_${room.id}`;
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: reversedMessages,
            timestamp: Date.now()
          }));
        }
        
        // Instant scroll to bottom when loading initial messages
        setTimeout(scrollToBottomInstant, 100);
      }
      
      setHasMoreMessages(response.current_page < response.last_page);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]); // Set empty array on error to prevent undefined issues
    } finally {
      setLoading(false);
    }
  }, [room?.id]);

  const initializeWebSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !room?.id) return;

    websocketService.initialize(token);
    
    // Join the chat room
    websocketService.joinRoom(room.id, {
      onMessage: (event) => {
        // Safety check for event structure
        if (!event || !event.message || !event.message.id) {
          console.error('❌ Invalid message structure received:', event);
          return;
        }
        
        const message = event.message;
        
        // ✅ Deduplicate: Check if message already exists (prevents duplicate keys)
        setMessages(prev => {
          // 🚫 Prevent duplicates - React key collision fix
          if (prev.some(m => m.id === message.id)) {
            return prev; // Return unchanged if duplicate
          }
          
          // ✅ Add new message only if it doesn't exist
          return [...prev, message];
        });
        
        // 📦 PERFORMANCE: Clear cache when receiving new message
        const cacheKey = `messages_room_${room.id}`;
        sessionStorage.removeItem(cacheKey);
        
        // Smart WhatsApp-like scrolling based on message sender
        if (message.user_id === user?.id) {
          // Always scroll for user's own messages
          smartAutoScroll(50, true);
        } else {
                  // Smart scroll for others' messages - only if user hasn't scrolled up
        smartAutoScroll(150, false);
      }
      },
      onMessageEdited: (event) => {
        // Handle real-time message edit
        if (!event || !event.message || !event.message.id) {
          console.error('❌ Invalid message edit structure received:', event);
          return;
        }
        
        const editedMessage = event.message;setMessages(prev => 
          prev.map(msg => 
            msg.id === editedMessage.id 
              ? { 
                  ...msg, 
                  message: editedMessage.message, 
                  status: editedMessage.status,
                  is_edited: editedMessage.is_edited,
                  updated_at: editedMessage.updated_at 
                }
              : msg
          )
        );
      },
      onMessageDeleted: (event) => {
        // Handle real-time message delete
        if (!event || !event.message_id) {
          console.error('❌ Invalid message delete structure received:', event);
          return;
        }
        
        const deletedMessageId = event.message_id;setMessages(prev => prev.filter(msg => msg.id !== deletedMessageId));
        
        // Cancel edit mode if the deleted message was being edited
        if (editingMessageId === deletedMessageId) {
          setEditingMessageId(null);
          setEditMessageText('');
        }
        
        // Cancel delete confirmation if the message was being deleted
        if (deletingMessageId === deletedMessageId) {
          setDeletingMessageId(null);
          setShowDeleteConfirm(false);
        }
      },
      onTyping: (event) => {// Safety check for event structure
        if (!event || !event.user || !event.user.id) {
          console.error('❌ Invalid typing event structure:', event);
          return;
        }
        
        // Don't show typing indicator for current user
        if (event.user.id === user?.id) {
          return;
        }
        
        setTypingUsers(prev => {
          if (event.is_typing) {
            // Add user to typing list if not already there
            const isAlreadyTyping = prev.some(u => u.id === event.user.id);
            if (!isAlreadyTyping) {
              return [...prev, event.user];
            }
            return prev;
          } else {
            // Remove user from typing list
            return prev.filter(u => u.id !== event.user.id);
          }
        });
        
        // Auto-remove typing indicator after 8 seconds (fallback - longer than backend timeout)
        if (event.is_typing) {
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.id !== event.user.id));
          }, 8000);
        }
      },
      onUserJoined: (event) => {
        if (!event || !event.user || !event.user.name) {
          console.error('❌ Invalid user joined event structure:', event);
          return;
        }
        
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          type: 'system',
          content: `${event.user.name} joined the room`,
          created_at: new Date().toISOString()
        }]);
        
        // Smart scroll for system messages
        smartAutoScroll(100, false);
      },
      onUserLeft: (event) => {
        if (!event || !event.user || !event.user.name) {
          console.error('❌ Invalid user left event structure:', event);
          return;
        }
        
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          type: 'system',
          content: `${event.user.name} left the room`,
          created_at: new Date().toISOString()
        }]);
        
        // Smart scroll for system messages
        smartAutoScroll(100, false);
      }
    });

    // Removed: Online users presence channel functionality

    setIsConnected(true);
  }, [room?.id, user?.id]);

  // Handle typing indicator with improved debouncing and efficiency
  const handleTypingIndicator = useCallback((value) => {
    if (!room?.id || !isConnected) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (value.trim()) {
      // Only send typing indicator if we haven't sent one recently
      const now = Date.now();
      const lastTypingSent = typingTimeoutRef.lastSent || 0;
      const timeSinceLastSent = now - lastTypingSent;
      
      // Only send typing indicator every 2 seconds max (debounce)
      if (timeSinceLastSent > 2000) {
        chatApiService.sendTypingIndicator(room.id, true)
          .catch(error => console.error('Failed to send typing indicator:', error));
        typingTimeoutRef.lastSent = now;
      }
      
      // Set timeout to stop typing indicator after 5 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        chatApiService.sendTypingIndicator(room.id, false)
          .catch(error => console.error('Failed to stop typing indicator:', error));
        typingTimeoutRef.lastSent = 0; // Reset so next typing will send immediately
      }, 5000); // Increased from 1 second to 5 seconds
    } else {
      // Only send stop indicator if we were actually typing
      if (typingTimeoutRef.lastSent > 0) {
        chatApiService.sendTypingIndicator(room.id, false)
          .catch(error => console.error('Failed to stop typing indicator:', error));
        typingTimeoutRef.lastSent = 0;
      }
    }
  }, [room?.id, isConnected]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isUploading) return;

    try {
      setIsUploading(true);
      
      // Stop typing indicator before sending message
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Only send stop indicator if we were actually typing
      if (typingTimeoutRef.lastSent > 0) {
        chatApiService.sendTypingIndicator(room.id, false)
          .catch(error => console.error('Failed to stop typing indicator:', error));
        typingTimeoutRef.lastSent = 0;
      }
      
      await chatApiService.sendMessage(room.id, {
        message: newMessage,
        type: 'text'
      });

      setNewMessage('');
      
      // 📦 PERFORMANCE: Clear cache when sending new message
      const cacheKey = `messages_room_${room.id}`;
      sessionStorage.removeItem(cacheKey);
      
      // WhatsApp-like auto-focus after sending (immediate)
      focusInputAfterSend(50);
      
      // Always scroll for user's own voice message (WhatsApp style)
      smartAutoScroll(50, true);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Effect hooks
  useEffect(() => {
    if (!room?.id || (!isMember && !isOwner)) return;

    // ✅ Fetch messages ONCE when entering room
    loadMessages();
    
    // ✅ Initialize WebSocket ONCE when entering room
    initializeWebSocket();

    return () => {
      if (room?.id) {
        websocketService.leaveRoom(room.id);
      }
      
      // Cleanup voice recording
      if (isRecording) {
        cancelRecording();
      }
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      // Cleanup typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        // Send stop typing indicator on cleanup if we were typing
        if (room?.id && typingTimeoutRef.lastSent > 0) {
          chatApiService.sendTypingIndicator(room.id, false)
            .catch(error => console.error('Failed to stop typing indicator on cleanup:', error));
        }
      }
    };
    // ✅ ONLY room?.id in dependencies - loadMessages and initializeWebSocket are stable callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id]);

  // Enhanced scroll behavior - only scroll on initial load, not when switching tabs
  useEffect(() => {
    // Only handle initial scroll to bottom when messages first load
    if (messages.length > 0 && lastScrollTop === 0 && !hasScrolledRef.current && isInitialMountRef.current) {
      const timer = setTimeout(() => {
        if (messagesContainerRef.current && !hasScrolledRef.current) {
          const container = messagesContainerRef.current;
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'auto' // Instant for initial load
          });
          setLastScrollTop(container.scrollTop);
          hasScrolledRef.current = true;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, lastScrollTop]);

  // Reset scroll flag when room changes
  useEffect(() => {
    hasScrolledRef.current = false;
  }, [room?.id]);

  // Auto-focus input only on initial mount, not when switching tabs
  useEffect(() => {
    // Only focus on initial mount, not when switching tabs
    if (isInitialMountRef.current && (isMember || isOwner) && inputRef.current && !hasFocusedRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current && !hasFocusedRef.current) {
        inputRef.current?.focus();
          hasFocusedRef.current = true;
        }
      }, 300);
      
      isInitialMountRef.current = false;
      return () => clearTimeout(timer);
    }
  }, [isMember, isOwner]);
  
  // Reset focus flag when room changes
  useEffect(() => {
    isInitialMountRef.current = true;
    hasFocusedRef.current = false;
  }, [room?.id]);

  // Initialize scroll state
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      setLastScrollTop(container.scrollTop);
      setUserScrolledUp(false);
    }
  }, [room?.id]); // Reset when room changes

  // Main render - WhatsApp style chat interface
  if (!isMember && !isOwner) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Join to Chat
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be a member to participate in the live chat.
          </p>
        </div>
      </div>
    );
  }

  const renderMessageContent = (message) => {
    switch (message.type) {
      case 'text':
        return (
          <p className="text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap">
            {message.message || '[No message content]'}
          </p>
        );
      
      case 'image':
        return (
          <div className="space-y-2">
            <img
              src={message.file_url}
              alt="Image"
              className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover"
              onClick={() => openImageModal(message.file_url)}
            />
            {message.message && !message.message.match(/^(image|video|document) file: .+\.(jpg|jpeg|png|gif|webp|mp4|avi|mov|pdf|doc|docx)$/i) && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {message.message}
              </p>
            )}
          </div>
        );
      
      case 'document':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <DocumentIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {message.message?.replace(/^Document: /, '')}
              </p>
              <a
                href={message.file_url}
                download
                className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group-hover:underline"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Download</span>
              </a>
            </div>
          </div>
        );
      
      case 'voice':
        return (
          <VoiceMessage
            src={message.file_url}
            message={message.message}
            isOwn={message.user_id === user?.id}
            canDelete={canUserDeleteMessage(message, user, userRole, room)}
            onDelete={() => startDeleteMessage(message.id)}
          />
        );
      
      case 'video':
        return (
          <div className="space-y-2">
            <video controls className="max-w-full rounded-lg">
              <source src={message.file_url} type="video/mp4" />
              Your browser does not support the video element.
            </video>
            {message.message && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {message.message}
              </p>
            )}
          </div>
        );
      
      default:
        return (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            [Unsupported message type: {message.type}]
          </p>
        );
    }
  };

  return (
    <>
      {/* Main Chat Interface - Fully Responsive */}
      <div className="h-[calc(100vh-16rem)] sm:h-[calc(100vh-14rem)] md:h-[600px] bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 flex flex-col md:flex-row rounded-lg shadow-sm relative">
        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col min-w-0 relative min-h-0">
          {/* Mobile Sidebar Toggle Button */}
          {isMobile && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="absolute top-3 right-3 z-20 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation"
              aria-label="Toggle members sidebar"
            >
              <UsersIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}

          {/* Messages Area - Scrollable */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 min-h-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.3'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
              scrollBehavior: 'smooth',
            }}
          >
            {loading ? (
              <div className="space-y-3 sm:space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={`skeleton-${index}`} className="animate-pulse">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-3 sm:h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-1.5 sm:mb-2"></div>
                        <div className="h-2.5 sm:h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Message bubbles will be rendered here */}
                {messages.map((message) => {
                  if (!message || !message.id) {return null;
                  }
                  
                  return (
                    <div key={message.id} className="mb-4">
                      {message.type === 'system' ? (
                        <div className="text-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                            {message.content || message.message || '[System message]'}
                          </span>
                        </div>
                      ) : (
                        <div 
                          className={`flex items-end space-x-2 sm:space-x-3 group ${
                            message.user_id === user?.id ? 'flex-row-reverse space-x-reverse' : ''
                          }`}
                          onMouseEnter={() => setHoveredMessageId(message.id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                          {/* Avatar */}
                          <div className="flex-shrink-0 mb-1">
                            <Avatar 
                              user={message.user}
                              size="sm"
                              showBorder={true}
                              className="w-7 h-7 sm:w-8 sm:h-8"
                            />
                          </div>

                          {/* Message Content */}
                          <div className={`flex-1 max-w-[75%] sm:max-w-xs md:max-w-sm lg:max-w-md relative ${
                            message.user_id === user?.id ? 'text-right' : ''
                          }`}>
                            {/* Show sender name and timestamp only for others */}
                            {message.user_id !== user?.id && (
                              <div className="flex items-baseline flex-wrap gap-1.5 sm:gap-2 mb-1">
                                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                  {message.user?.name || 'Unknown User'}
                                </span>
                                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                  {message.created_at ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true }) : 'Unknown time'}
                                </span>
                              </div>
                            )}
                            
                            {/* Message Bubble */}
                            <div className={`relative inline-block p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm max-w-full ${
                              message.user_id === user?.id
                                ? 'bg-blue-500 text-white rounded-br-md sm:rounded-br-md ml-auto'
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-md sm:rounded-bl-md'
                            }`}>
                              
                              {/* Edit/Delete Actions - Own messages or role-based permissions (exclude voice messages) */}
                              {canUserInteractWithMessage(message, user, userRole, room) && 
                               hoveredMessageId === message.id && 
                               editingMessageId !== message.id &&
                               message.type !== 'voice' && (
                                <div className={`absolute top-1 ${
                                  message.user_id === user?.id ? 'left-1' : 'right-1'
                                } flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                                  {/* Edit Button - Only for own text messages */}
                                  {message.user_id === user?.id && message.type === 'text' && (
                                    <button
                                      onClick={() => startEditMessage(message)}
                                      className="w-6 h-6 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full flex items-center justify-center transition-all duration-200"
                                      title="Edit message"
                                    >
                                      <PencilIcon className="w-3 h-3" />
                                    </button>
                                  )}
                                  
                                  {/* Delete Button - Role-based permissions */}
                                  {canUserDeleteMessage(message, user, userRole, room) && (
                                    <button
                                      onClick={() => startDeleteMessage(message.id)}
                                      className="w-6 h-6 bg-red-500 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full flex items-center justify-center transition-all duration-200"
                                      title={`Delete ${message.type === 'text' ? 'message' : message.type === 'voice' ? 'voice message' : message.type === 'image' ? 'image' : 'file'}${
                                        message.user_id !== user?.id ? ` (${userRole === 'owner' ? 'Owner' : 'Moderator'})` : ''
                                      }`}
                                    >
                                      <TrashIcon className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Edit Mode */}
                              {editingMessageId === message.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    ref={editInputRef}
                                    value={editMessageText}
                                    onChange={(e) => setEditMessageText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        saveEditMessage();
                                      } else if (e.key === 'Escape') {
                                        cancelEditMessage();
                                      }
                                    }}
                                    className="w-full p-2 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={1}
                                    style={{ minHeight: '36px' }}
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={cancelEditMessage}
                                      className="px-3 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={saveEditMessage}
                                      disabled={!editMessageText.trim()}
                                      className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md transition-colors"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {renderMessageContent(message)}
                                  {/* Edited indicator */}
                                  {message.is_edited && (
                                    <div className="text-xs opacity-60 mt-1">
                                      (edited)
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            
                            {/* Timestamp for own messages */}
                            {message.user_id === user?.id && editingMessageId !== message.id && (
                              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                                {message.created_at ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true }) : 'Unknown time'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Typing Indicators - Responsive */}
                {typingUsers.length > 0 && (
                  <div className="mb-2 sm:mb-3">
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <div className="flex -space-x-1">
                        {typingUsers.slice(0, 2).map((user, index) => (
                          <Avatar 
                            key={user.id}
                            user={user}
                            size="xs"
                            showBorder={true}
                            className="border-2 border-white dark:border-gray-800 w-5 h-5 sm:w-6 sm:h-6"
                          />
                        ))}
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[100px] sm:max-w-none">
                            {typingUsers.length === 1 
                              ? `${typingUsers[0].name}`
                              : typingUsers.length === 2
                              ? `${typingUsers[0].name} & ${typingUsers[1].name}`
                              : `${typingUsers[0].name} +${typingUsers.length - 1}`
                            }
                          </span>
                          <div className="flex space-x-0.5">
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Enhanced scroll target with minimal space */}
                <div ref={messagesEndRef} className="h-4 w-full" />
              </>
            )}
          </div>

          {/* Main Input Area - Responsive - Fixed at bottom of chat container */}
          {(isMember || isOwner) && (
            <div className="p-2 sm:p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
              <div className="max-w-4xl mx-auto">
                {/* Voice Recording Preview - WhatsApp Style */}
                {recordedAudio && (
                  <div className="mb-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 sm:p-4 rounded-xl border border-green-200 dark:border-green-700">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <button
                        onClick={() => {
                          const audioElement = document.getElementById('preview-audio');
                          if (audioElement) {
                            if (audioElement.paused) {
                              audioElement.play();
                            } else {
                              audioElement.pause();
                            }
                          }
                        }}
                        className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 touch-manipulation"
                      >
                        <div className="w-0 h-0 border-l-[4px] sm:border-l-[6px] border-t-[3px] sm:border-t-[4px] border-b-[3px] sm:border-b-[4px] border-t-transparent border-b-transparent ml-0.5 border-l-white"></div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm text-green-600 dark:text-green-400 truncate">
                          Voice message • {formatRecordingTime(recordingTime)}
        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                          onClick={sendVoiceMessage}
                          disabled={isUploading}
                          className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 touch-manipulation"
                          title="Send voice message"
                        >
                          {isUploading ? (
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </button>
                        <button
                          onClick={cancelRecording}
                          className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 touch-manipulation"
                          title="Cancel voice message"
                        >
                          <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                      <audio
                        id="preview-audio"
                        className="hidden"
                        src={URL.createObjectURL(recordedAudio)}
                      />
                    </div>
                  </div>
                )}

                {/* Active Recording Indicator */}
                {isRecording && (
                  <div className="mb-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-3 rounded-xl border border-red-200 dark:border-red-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">Recording</span>
                        <span className="text-xs sm:text-sm font-mono text-gray-600 dark:text-gray-400">
                          {formatRecordingTime(recordingTime)}
                        </span>
                      </div>
                      <button
                        onClick={stopRecording}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-medium rounded-full transition-all duration-200 touch-manipulation"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                )}

                {/* File Preview Area */}
                {selectedFiles.length > 0 && (
                  <div className="mb-3 bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                      </h3>
                      <button
                        onClick={cancelFileSelection}
                        className="text-gray-400 hover:text-red-500 transition-colors touch-manipulation"
                        title="Cancel"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 sm:h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-20 sm:h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <DocumentIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Controls */}
                <div className="flex items-end space-x-2 sm:space-x-3">
                  {/* Text Input */}
                  <div className="flex-1 relative min-w-0">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-20 transition-all duration-200">
                      <textarea
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewMessage(value);
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                          handleTypingIndicator(value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        placeholder="Type a message..."
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-12 sm:pr-16 bg-transparent text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-0 resize-none focus:outline-none focus:ring-0"
                        rows={1}
                        style={{ 
                          minHeight: '40px', 
                          maxHeight: '120px',
                          lineHeight: '1.5'
                        }}
                        disabled={isUploading || isRecording || recordedAudio}
                      />
                      
                      {/* Input Controls */}
                      <div className="absolute right-1.5 sm:right-2 bottom-1.5 sm:bottom-2 flex items-center space-x-0.5 sm:space-x-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.rtf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-600 transition-all duration-200 touch-manipulation"
                          disabled={isUploading || isRecording || recordedAudio || selectedFiles.length > 0}
                          title="Attach file"
                          aria-label="Attach file"
                        >
                          <PaperClipIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-600 transition-all duration-200 touch-manipulation"
                          disabled={isUploading || isRecording || recordedAudio || selectedFiles.length > 0}
                          title="Add emoji"
                          aria-label="Add emoji"
                        >
                          <FaceSmileIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Voice/Send Button */}
                  {!newMessage.trim() && !recordedAudio ? (
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 touch-manipulation ${
                        isRecording 
                          ? 'bg-red-500 text-white shadow-lg scale-110 animate-pulse' 
                          : 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white shadow-md hover:shadow-lg hover:scale-110 active:scale-95'
                      }`}
                      disabled={isUploading || recordedAudio}
                      title={isRecording ? 'Stop recording' : 'Record voice message'}
                      aria-label={isRecording ? 'Stop recording' : 'Record voice message'}
                    >
                      {isRecording ? (
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-sm"></div>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ) : newMessage.trim() ? (
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-md hover:shadow-lg flex-shrink-0 touch-manipulation"
                      title="Send message"
                      aria-label="Send message"
                    >
                      <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Room Members Sidebar - Responsive */}
        {/* Mobile: Overlay sidebar */}
        {isMobile && showSidebar && (
          <>
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setShowSidebar(false)}
              aria-hidden="true"
            />
            <div className="fixed right-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-50 md:hidden shadow-2xl overflow-y-auto custom-scrollbar">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Members</h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation"
                  aria-label="Close sidebar"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <button 
                  onClick={() => {
                    setShowSidebar(false);
                    setShowMembersModal(true);
                  }}
                  className="w-full p-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left mb-4 touch-manipulation"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <UsersIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        All Members
                      </h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Click to view
                      </p>
                    </div>
                  </div>
                </button>
                
                <OnlineMembers 
                  room={room} 
                  user={user}
                  onMemberClick={(member) => {
                    setShowSidebar(false);
                    setSelectedUserProfile(member);
                    setShowUserProfileModal(true);
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* Desktop: Always visible sidebar */}
        <div className="hidden md:flex md:w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-col flex-shrink-0">
          <button 
            onClick={() => setShowMembersModal(true)}
            className="w-full p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <UsersIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  All Members
                </h4>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Click to view
                </p>
              </div>
            </div>
          </button>
          
          {/* Online Members Component */}
                     <OnlineMembers 
             room={room} 
             user={user}
             onMemberClick={(member) => {
               setSelectedUserProfile(member);
               setShowUserProfileModal(true);
             }}
           />
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModalOpen && !!viewingImage}
        imageUrl={viewingImage}
        altText="Shared image"
        onClose={closeImageModal}
        showDownload={true}
        showZoom={true}
      />

      {/* Room Members Modal */}
      <RoomMembersModal
        room={room}
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedUserProfile}
        currentUser={user}
        room={room}
        isOpen={showUserProfileModal}
        onClose={() => {
          setShowUserProfileModal(false);
          setSelectedUserProfile(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingMessageId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={cancelDeleteMessage}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete {(() => {
                    const messageToDelete = messages.find(msg => msg.id === deletingMessageId);
                    const type = messageToDelete?.type || 'message';
                    return type === 'text' ? 'Message' : 
                           type === 'voice' ? 'Voice Message' : 
                           type === 'image' ? 'Image' : 
                           type === 'video' ? 'Video' :
                           type === 'document' ? 'Document' : 'File';
                  })()}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {(() => {
                const messageToDelete = messages.find(msg => msg.id === deletingMessageId);
                const type = messageToDelete?.type || 'message';
                return type === 'text' ? 'Are you sure you want to delete this message? It will be permanently removed from the chat.' :
                       type === 'voice' ? 'Are you sure you want to delete this voice message? The audio file will be permanently removed.' :
                       type === 'image' ? 'Are you sure you want to delete this image? It will be permanently removed from the chat.' :
                       type === 'video' ? 'Are you sure you want to delete this video? It will be permanently removed from the chat.' :
                       'Are you sure you want to delete this file? It will be permanently removed from the chat.';
              })()}
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteMessage}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMessage}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete {(() => {
                  const messageToDelete = messages.find(msg => msg.id === deletingMessageId);
                  const type = messageToDelete?.type || 'message';
                  return type === 'text' ? 'Message' : 
                         type === 'voice' ? 'Voice' : 
                         type === 'image' ? 'Image' : 
                         type === 'video' ? 'Video' : 'File';
                })()}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 🚀 PERFORMANCE: Memoize the entire component to prevent unnecessary re-renders
export default React.memo(RoomChat); 