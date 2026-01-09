import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UsersIcon,
  LockClosedIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import RoomTabs from '../components/rooms/RoomTabs';
import RoomChat from '../components/rooms/tabs/RoomChat'; // Keep chat non-lazy for your original design
import JoinRoomForm from '../components/rooms/JoinRoomForm';
import RoomMembersModal from '../components/rooms/RoomMembersModal';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import { checkUserMembership } from '../utils/roomUtils';

// Lazy load non-chat tabs for better LCP performance
const RoomPosts = React.lazy(() => import('../components/rooms/tabs/RoomPosts'));
const RoomProducts = React.lazy(() => import('../components/rooms/tabs/RoomProducts'));
const RoomDirectMessages = React.lazy(() => import('../components/rooms/RoomDirectMessages'));

const RoomPage = React.memo(() => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Tab Persistence Feature:
   * - Saves the active tab to localStorage when changed
   * - Restores the saved tab when returning to the room
   * - Validates that saved tabs are still valid for the room type
   * - Each room has its own saved tab state
   */

  // Initialize activeTab from localStorage or default to 'chat'
  const [activeTab, setActiveTab] = useState(() => {
    if (roomId) {
      const savedTab = localStorage.getItem(`room_${roomId}_activeTab`);
      return savedTab || 'chat';
    }
    return 'chat';
  });
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(64); // Default mobile height
  const headerRef = useRef(null);

  // Handle tab change and save to localStorage - Prevent scroll jump
  const handleTabChange = (tabId) => {
    // Store current scroll position
    const scrollY = window.scrollY;

    // Change tab
    setActiveTab(tabId);
    if (roomId) {
      localStorage.setItem(`room_${roomId}_activeTab`, tabId);
      if (process.env.NODE_ENV === 'development') { }
    }

    // Restore scroll position to prevent jump
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  // Load saved tab when roomId changes
  useEffect(() => {
    if (roomId) {
      const savedTab = localStorage.getItem(`room_${roomId}_activeTab`);
      if (process.env.NODE_ENV === 'development') { }
      if (savedTab) {
        setActiveTab(savedTab);
      } else {
        setActiveTab('chat'); // Default tab
      }
      fetchRoomData();
    }
  }, [roomId]);

  // Clean up localStorage for tabs that no longer exist
  useEffect(() => {
    if (roomData && roomId) {
      const savedTab = localStorage.getItem(`room_${roomId}_activeTab`);
      if (savedTab) {
        const validTabs = ['chat', 'posts', 'messages'];
        if (roomData.is_commercial) {
          validTabs.push('products');
        }

        if (!validTabs.includes(savedTab)) {
          if (process.env.NODE_ENV === 'development') { }
          localStorage.removeItem(`room_${roomId}_activeTab`);
          setActiveTab('chat');
        }
      }
    }
  }, [roomData, roomId]);

  // Calculate header height dynamically for sticky positioning
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        // Get header height (accessing offsetHeight also forces a reflow)
        const height = headerRef.current.offsetHeight;
        setHeaderHeight(height);
      }
    };

    // Calculate immediately
    updateHeaderHeight();

    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      updateHeaderHeight();
      // Double RAF for better accuracy
      requestAnimationFrame(() => {
        updateHeaderHeight();
      });
    });

    // Recalculate on window resize
    window.addEventListener('resize', updateHeaderHeight);

    // Use ResizeObserver for more accurate height tracking
    let resizeObserver;
    if (headerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateHeaderHeight();
      });
      resizeObserver.observe(headerRef.current);
    }

    // Use MutationObserver to watch for DOM changes (like chat loading)
    let mutationObserver;
    if (headerRef.current && window.MutationObserver) {
      mutationObserver = new MutationObserver(() => {
        // Debounce the update
        setTimeout(updateHeaderHeight, 10);
      });
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }

    // Recalculate after delays to catch async content (especially chat loading)
    const timeoutId1 = setTimeout(updateHeaderHeight, 50);
    const timeoutId2 = setTimeout(updateHeaderHeight, 200);
    const timeoutId3 = setTimeout(updateHeaderHeight, 500);
    const timeoutId4 = setTimeout(updateHeaderHeight, 1000); // For slow chat loading

    // If chat tab is active, add extra delays for chat content loading
    let chatTimeout1, chatTimeout2;
    if (activeTab === 'chat') {
      chatTimeout1 = setTimeout(updateHeaderHeight, 1500);
      chatTimeout2 = setTimeout(updateHeaderHeight, 2500);
    }

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      clearTimeout(timeoutId4);
      if (chatTimeout1) clearTimeout(chatTimeout1);
      if (chatTimeout2) clearTimeout(chatTimeout2);
    };
  }, [roomData, loading, isMember, isOwner, activeTab]);

  useEffect(() => {
    if (user && roomData) {
      setIsOwner(roomData.owner_id === user.id);
      const initialMembership = checkUserMembership(roomData, user.id);
      setIsMember(initialMembership);
      // Pass roomData to avoid duplicate API call
      checkMembershipStatus(roomData);
    }
  }, [user, roomData]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);

      // Cache for better LCP performance
      const cacheKey = `room_${roomId}`;
      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 60000) { // 1 minute cache
          setRoomData(data);
          setLoading(false);
          // Still fetch fresh data in background
          apiService.get(`/rooms/${roomId}`).then(response => {
            const room = response.data?.room || response.room || response.data || response;
            setRoomData(room);
            sessionStorage.setItem(cacheKey, JSON.stringify({
              data: room,
              timestamp: Date.now()
            }));
          }).catch(() => { });
          return;
        }
      }

      const response = await apiService.get(`/rooms/${roomId}`);
      const room = response.data?.room || response.room || response.data || response;
      setRoomData(room);

      // Cache the data
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: room,
        timestamp: Date.now()
      }));

    } catch (error) {
      console.error('Error fetching room data:', error);
      if (error.response?.status === 404) {
        navigate('/user/rooms', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const checkMembershipStatus = async (roomDetails = null) => {
    try {
      // Use provided room data if available to avoid duplicate API call
      let roomInfo = roomDetails;
      if (!roomInfo) {
        const response = await apiService.get(`/rooms/${roomId}`);
        roomInfo = response.data?.room || response.room || response.data || response;
      }

      const currentUserMembership = roomInfo.members?.find(
        member => (member.user?.id || member.user_id || member.id) === user.id
      );

      if (currentUserMembership) {
        setIsMember(true);
        setMembershipStatus(currentUserMembership.status || 'approved');
      } else {
        setIsMember(false);
        setMembershipStatus(null);
      }
    } catch (error) {
      console.error('Error checking membership status:', error);
      setIsMember(false);
      setMembershipStatus(null);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleJoinRoom = async (password = null) => {
    setJoinLoading(true);
    try {
      const payload = password ? { password } : {};
      const response = await apiService.post(`/rooms/${roomId}/join`, payload);

      await checkMembershipStatus();
      setShowJoinForm(false);

      const message = response.data?.message || response.message;
      if (message) {
        showNotification(message);
      } else if (roomData.type === 'private') {
        showNotification('Join request sent! Waiting for approval.');
      } else {
        showNotification('Successfully joined the room!');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      const errorMessage = error.response?.data?.message || 'Failed to join room';
      showNotification(errorMessage, 'error');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    setLeaveLoading(true);
    try {
      await apiService.post(`/rooms/${roomId}/leave`);

      // Update membership status
      setIsMember(false);
      setMembershipStatus(null);
      setShowLeaveConfirm(false);

      showNotification('You have successfully left the room.');

      // Refresh room data to update member count
      await fetchRoomData();

      // Redirect to rooms page after a short delay
      setTimeout(() => {
        navigate('/user/rooms');
      }, 2000);

    } catch (error) {
      console.error('Error leaving room:', error);
      const errorMessage = error.response?.data?.message || 'Failed to leave room';
      showNotification(errorMessage, 'error');
    } finally {
      setLeaveLoading(false);
    }
  };

  const getTypeIcon = () => {
    switch (roomData?.type) {
      case 'public':
        return <GlobeAltIcon className="w-5 h-5 text-green-500" />;
      case 'private':
        return <LockClosedIcon className="w-5 h-5 text-orange-500" />;
      case 'secure':
        return <ShieldCheckIcon className="w-5 h-5 text-red-500" />;
      default:
        return <GlobeAltIcon className="w-5 h-5 text-green-500" />;
    }
  };

  const getTypeBadgeColor = () => {
    switch (roomData?.type) {
      case 'public':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'private':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'secure':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  // Tab configuration
  const tabs = [
    {
      id: 'chat',
      name: 'Live Chat',
      icon: '💬',
      component: RoomChat
    },
    {
      id: 'posts',
      name: 'Posts',
      icon: '📄',
      component: RoomPosts
    },
    {
      id: 'messages',
      name: 'Your Direct Messages',
      icon: '💌',
      component: RoomDirectMessages
    }
  ];

  // Add Products tab for commercial rooms
  if (roomData?.is_commercial) {
    tabs.push({
      id: 'products',
      name: 'Products',
      icon: '🛍️',
      component: RoomProducts
    });
  }

  const renderTabContent = () => {
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    if (!activeTabData) return null;

    // Determine user role
    const getUserRole = () => {
      if (isOwner) return 'owner';

      const currentUserMembership = roomData.members?.find(
        member => (member.user?.id || member.user_id) === user.id
      );

      return currentUserMembership?.role || 'member';
    };

    const TabComponent = activeTabData.component;

    // Only lazy load non-chat tabs to preserve your original chat design
    const isLazyTab = activeTab !== 'chat';

    if (isLazyTab) {
      return (
        <React.Suspense
          fallback={
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {activeTab === 'posts' && (
                  // Posts skeleton
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-1"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    </div>
                  ))
                )}
                {(activeTab === 'products' || activeTab === 'messages') && (
                  // Generic skeleton for other tabs
                  <div className="h-96 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                )}
              </div>
            </div>
          }
        >
          <TabComponent
            room={roomData}
            currentUser={user}
            user={user}
            isMember={isMember}
            isOwner={isOwner}
            userRole={getUserRole()}
          />
        </React.Suspense>
      );
    }

    // Chat tab loads immediately without Suspense to preserve your design
    return (
      <TabComponent
        room={roomData}
        currentUser={user}
        user={user}
        isMember={isMember}
        isOwner={isOwner}
        userRole={getUserRole()}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          {/* Header Skeleton - Better layout matching */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                  <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2"></div>
                    <div className="flex items-center space-x-4">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                    </div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-64 mt-2"></div>
                  </div>
                </div>
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-lg w-32"></div>
              </div>
            </div>
          </div>

          {/* Tab Navigation Skeleton */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-8">
                {['Live Chat', 'Posts', 'Messages'].map((tabName, i) => (
                  <div key={i} className="py-4 border-b-2 border-transparent">
                    <div className="flex items-center space-x-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Skeleton - Chat preview for better LCP with reserved space */}
          <div className="max-w-7xl mx-auto" style={{ minHeight: "400px" }}>
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                  style={{ minHeight: "60px" }} // Reserve space to prevent CLS
                >
                  <div className={`flex items-start space-x-3 max-w-xs ${i % 2 === 0 ? '' : 'flex-row-reverse space-x-reverse'}`}>
                    {i % 2 === 0 && (
                      <div
                        className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"
                        style={{
                          width: "32px",
                          height: "32px",
                          minWidth: "32px",
                          minHeight: "32px"
                        }}
                      ></div>
                    )}
                    <div
                      className={`p-3 rounded-lg ${i % 2 === 0 ? 'bg-gray-200 dark:bg-gray-700' : 'bg-blue-200 dark:bg-blue-800'}`}
                      style={{ minHeight: "48px", minWidth: "120px" }}
                    >
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Room Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The room you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/user/rooms')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`max-w-sm px-4 py-3 rounded-lg shadow-lg border ${notification.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => setNotification(null)}
                className="ml-3 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Header - Fully Responsive */}
      <div ref={headerRef} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Desktop Layout (≥1024px): Horizontal */}
          <div className="hidden lg:flex items-center justify-between gap-4 py-4">
            {/* Left Section: Back + Room Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Back Button */}
              <button
                onClick={() => navigate('/user/rooms')}
                className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                aria-label="Back to rooms"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>

              {/* Room Image/Icon */}
              <div className="relative flex-shrink-0">
                {roomData.image_url ? (
                  <img
                    src={roomData.image_url}
                    alt={roomData.name}
                    className="w-12 h-12 rounded-lg object-cover"
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                    width="48"
                    height="48"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {roomData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Commercial Badge */}
                {roomData.is_commercial && (
                  <div className="absolute -top-1 -right-1">
                    <span className="inline-flex items-center w-5 h-5 rounded-full text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      <ShoppingBagIcon className="w-3 h-3 mx-auto" />
                    </span>
                  </div>
                )}
              </div>

              {/* Room Title + Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                    {roomData.name}
                  </h1>

                  {/* Visibility Badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getTypeBadgeColor()}`}>
                    {getTypeIcon()}
                    <span className="capitalize">{roomData.type}</span>
                  </span>

                  {/* Members Count */}
                  <button
                    onClick={() => setShowMembersModal(true)}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0"
                    title="View room members"
                  >
                    <UsersIcon className="w-4 h-4" />
                    <span>{roomData.members_count || roomData.members?.length || 0} members</span>
                  </button>
                </div>

                {roomData.description && (
                  <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                    {roomData.description}
                  </p>
                )}
              </div>
            </div>

            {/* Right Section: Primary Action */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Join/Manage Button */}
              {!isOwner && !isMember && (
                <button
                  onClick={() => {
                    if (roomData.type === 'secure') {
                      setShowJoinForm(true);
                    } else {
                      handleJoinRoom();
                    }
                  }}
                  disabled={joinLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  <span>{joinLoading ? 'Joining...' : (roomData.type === 'private' ? 'Request to Join' : 'Join Room')}</span>
                </button>
              )}

              {isMember && !isOwner && (
                <div className="inline-flex items-center rounded-lg overflow-hidden border border-green-200 dark:border-green-800">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Member</span>
                  </div>
                  <button
                    onClick={() => setShowLeaveConfirm(true)}
                    className="inline-flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium transition-colors duration-200 border-l border-red-200 dark:border-red-800"
                    title="Leave Room"
                  >
                    Leave
                  </button>
                </div>
              )}

              {isOwner && (
                <button
                  onClick={() => navigate(`/user/rooms/${roomId}/manage`)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 mr-2"
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                  <span>Manage Room</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Layout (≤768px): Stacked */}
          <div className="lg:hidden py-3 space-y-3">
            {/* Top Row: Back + Title */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Back Button */}
              <button
                onClick={() => navigate('/user/rooms')}
                className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 touch-manipulation"
                aria-label="Back to rooms"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>

              {/* Room Image/Icon */}
              <div className="relative flex-shrink-0">
                {roomData.image_url ? (
                  <img
                    src={roomData.image_url}
                    alt={roomData.name}
                    className="w-10 h-10 rounded-lg object-cover"
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                    width="40"
                    height="40"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-base font-bold">
                      {roomData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Commercial Badge */}
                {roomData.is_commercial && (
                  <div className="absolute -top-0.5 -right-0.5">
                    <span className="inline-flex items-center w-4 h-4 rounded-full text-[8px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      <ShoppingBagIcon className="w-2.5 h-2.5 mx-auto" />
                    </span>
                  </div>
                )}
              </div>

              {/* Room Title - Truncate if needed */}
              <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate flex-1 min-w-0">
                {roomData.name}
              </h1>

              {/* Mobile Action Button - Compact Icon */}
              {isOwner && (
                <button
                  onClick={() => navigate(`/user/rooms/${roomId}/manage`)}
                  className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 touch-manipulation mr-2"
                  aria-label="Manage Room"
                  title="Manage Room"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
              )}

              {!isOwner && !isMember && (
                <button
                  onClick={() => {
                    if (roomData.type === 'secure') {
                      setShowJoinForm(true);
                    } else {
                      handleJoinRoom();
                    }
                  }}
                  disabled={joinLoading}
                  className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200 touch-manipulation"
                  aria-label={joinLoading ? 'Joining...' : 'Join Room'}
                  title={joinLoading ? 'Joining...' : 'Join Room'}
                >
                  {joinLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <UserPlusIcon className="w-5 h-5" />
                  )}
                </button>
              )}

              {isMember && !isOwner && (
                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg transition-colors duration-200 touch-manipulation"
                  aria-label="Leave Room"
                  title="Leave Room"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Second Row: Badge + Members Count */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Visibility Badge */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor()}`}>
                {getTypeIcon()}
                <span className="capitalize">{roomData.type}</span>
              </span>

              {/* Members Count */}
              <button
                onClick={() => setShowMembersModal(true)}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation"
                title="View room members"
              >
                <UsersIcon className="w-3.5 h-3.5" />
                <span>{roomData.members_count || roomData.members?.length || 0} members</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <RoomTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        disabled={!isMember && !isOwner}
        headerHeight={headerHeight}
      />

      {/* Tab Content - Responsive */}
      <div className="flex-1 min-h-0 overflow-hidden max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6">
        {!isMember && !isOwner ? (
          <div className="p-8 text-center">
            <LockClosedIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {roomData.type === 'private' ? 'Request Access to Join' : 'Join This Room'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {roomData.type === 'private'
                ? 'This is a private room. Send a request to the room owner for approval to access posts, chat, and other content.'
                : 'Join this room to access posts, live chat, and interact with other members.'
              }
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (roomData.type === 'secure') {
                    setShowJoinForm(true);
                  } else {
                    handleJoinRoom();
                  }
                }}
                disabled={joinLoading}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <UserPlusIcon className="w-5 h-5 mr-2" />
                {joinLoading ? (
                  roomData.type === 'private' ? 'Sending Request...' : 'Joining...'
                ) : (
                  roomData.type === 'private' ? 'Send Join Request' : (
                    roomData.type === 'secure' ? 'Enter Password' : 'Join Room'
                  )
                )}
              </button>

              {roomData.type === 'public' && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Public room - Instant access
                </p>
              )}
              {roomData.type === 'private' && (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  ⏳ Requires approval from room owner
                </p>
              )}
              {roomData.type === 'secure' && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  🔒 Password protected
                </p>
              )}
            </div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      {/* Join Room Form Modal */}
      {showJoinForm && (
        <JoinRoomForm
          room={roomData}
          onJoin={handleJoinRoom}
          onClose={() => setShowJoinForm(false)}
          loading={joinLoading}
        />
      )}

      {/* Leave Room Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowLeaveConfirm(false)} />

            <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3">
                  <span className="text-red-600 dark:text-red-400 text-lg">⚠️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Leave Room</h3>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to leave "{roomData.name}"? You'll lose access to all posts, chats, and content in this room.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  disabled={leaveLoading}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveRoom}
                  disabled={leaveLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
                >
                  {leaveLoading ? 'Leaving...' : 'Leave Room'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Members Modal */}
      <RoomMembersModal
        room={roomData}
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
      />
    </div>
  );
});

RoomPage.displayName = 'RoomPage';

export default RoomPage; 