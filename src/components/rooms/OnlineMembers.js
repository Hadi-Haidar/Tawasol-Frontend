import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserGroupIcon, 
  EyeIcon,
  ClockIcon,
  ArrowPathIcon,
  WifiIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../common/Avatar';
import onlineMembersApi from '../../services/onlineMembersApi';
import websocketService from '../../services/websocket';

const OnlineMembers = ({ room, user, onMemberClick }) => {
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Heartbeat system refs
  const heartbeatIntervalRef = React.useRef(null);
  const visibilityTimeoutRef = React.useRef(null);

  // Fetch online members via API
  const fetchOnlineMembers = useCallback(async () => {
    if (!room?.id) return;

    try {
      setError(null);
      const response = await onlineMembersApi.getOnlineMembers(room.id);
      setOnlineMembers(response.online_members || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching online members:', err);
      setError('Failed to load online members');
    } finally {
      setLoading(false);
    }
  }, [room?.id]);

  // Mark user as online when component mounts
  const markSelfOnline = useCallback(async () => {
    if (!room?.id) return;

    try {
      await onlineMembersApi.markOnline(room.id);
      fetchOnlineMembers(); // Refresh the list
    } catch (err) {
      console.error('Error marking self as online:', err);
    }
  }, [room?.id, fetchOnlineMembers]);

  // Mark user as offline when component unmounts
  const markSelfOffline = useCallback(async () => {
    if (!room?.id) return;

    try {
      await onlineMembersApi.markOffline(room.id);
    } catch (err) {
      console.error('Error marking self as offline:', err);
    }
  }, [room?.id]);

  // Heartbeat function to keep user alive
  const sendHeartbeat = useCallback(async () => {
    if (!room?.id) return;

    try {
      await onlineMembersApi.updateActivity(room.id);} catch (err) {
      console.error('💔 [OnlineMembers] Heartbeat failed:', err);
    }
  }, [room?.id]);

  // Start heartbeat system
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Send immediate heartbeat, then every 2 minutes (well before the 8-minute timeout)
    sendHeartbeat();
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 2 * 60 * 1000);
  }, [sendHeartbeat]);

  // Stop heartbeat system
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Handle page visibility changes
  const handleVisibilityChange = useCallback(async () => {
    if (document.hidden) {
      // Page is hidden - stop heartbeat
      stopHeartbeat();
      
      // Set a timeout to mark offline if hidden for too long (3 minutes)
      visibilityTimeoutRef.current = setTimeout(async () => {
        await markSelfOffline();
      }, 3 * 60 * 1000);
    } else {
      // Page is visible - restart heartbeat
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
      
      await markSelfOnline(); // Refresh online status
      startHeartbeat();
      fetchOnlineMembers(); // Refresh the online members list immediately
    }
  }, [stopHeartbeat, markSelfOffline, markSelfOnline, startHeartbeat, fetchOnlineMembers]);

  // Handle real-time online status changes
  const handleOnlineStatusChange = useCallback((eventData) => {
    if (eventData && eventData.online_members && Array.isArray(eventData.online_members)) {
      setOnlineMembers(eventData.online_members);
      setLastUpdate(new Date());
      setError(null);
    }
  }, []);

  // Setup real-time listener (piggyback on chat's WebSocket)
  useEffect(() => {
    if (!room?.id || !user?.id) return;

    // Check if WebSocket service is already connected (by chat)
    const checkAndSetupRealTime = () => {
      const pusher = websocketService.getPusher();
      
      if (pusher && websocketService.isConnectedToSocket()) {// Get the existing channel that chat created
        const channelName = `private-chat.room.${room.id}`;
        const existingChannel = pusher.channels.channels[channelName];
        
        if (existingChannel) {
          // Listen for online status changes on the existing channel
          existingChannel.bind('user.online.status', handleOnlineStatusChange);
          setIsRealTimeActive(true);
          
          return () => {
            // Clean up the listener when component unmounts
            existingChannel.unbind('user.online.status', handleOnlineStatusChange);
          };
        } else {
          console.log('Channel not found, real-time not available');
        }
      } else {
        setIsRealTimeActive(false);
      }
    };

    // Try to setup real-time immediately
    const cleanup = checkAndSetupRealTime();
    
    // Also retry every 5 seconds in case WebSocket connects later
    const retryInterval = setInterval(() => {
      if (!isRealTimeActive) {
        const newCleanup = checkAndSetupRealTime();
        if (newCleanup) {
          clearInterval(retryInterval);
        }
      }
    }, 5000);

    return () => {
      clearInterval(retryInterval);
      if (cleanup) cleanup();
    };
  }, [room?.id, user?.id, handleOnlineStatusChange, isRealTimeActive]);

  // Initialize when component mounts
  useEffect(() => {
    if (room?.id && user?.id) {
      markSelfOnline();
      
      // Start heartbeat system
      startHeartbeat();
      
      // API polling fallback (less frequent when real-time is active)
      const pollInterval = isRealTimeActive ? 60000 : 30000; // 60s if real-time, 30s if not
      const interval = setInterval(fetchOnlineMembers, pollInterval);

      return () => {
        clearInterval(interval);
        stopHeartbeat();
        markSelfOffline();
      };
    }
  }, [room?.id, user?.id, markSelfOnline, fetchOnlineMembers, markSelfOffline, isRealTimeActive, startHeartbeat, stopHeartbeat]);

  // Setup page visibility listener for heartbeat management
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [handleVisibilityChange]);

  // Handle member click
  const handleMemberClick = (member) => {
    if (onMemberClick && typeof onMemberClick === 'function') {
      onMemberClick(member);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <UserGroupIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Online Members
          </h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={`skeleton-${index}`} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <UserGroupIcon className="w-5 h-5 text-green-500" />
            {onlineMembers.length > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Online Members
          </h3>
          {/* Real-time indicator */}
          <div className="flex items-center space-x-1">
            <WifiIcon className={`w-3 h-3 ${
              isRealTimeActive ? 'text-green-500' : 'text-gray-400'
            }`} />
            {isRealTimeActive && (
              <span className="text-xs text-green-600 dark:text-green-400">Live</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {onlineMembers.length}
          </span>
          <button
            onClick={fetchOnlineMembers}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Last update indicator */}
      {lastUpdate && (
        <div className="mb-3 text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
          <ClockIcon className="w-3 h-3" />
          <span>
            Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
            {isRealTimeActive && <span className="text-green-600 dark:text-green-400"> (Live)</span>}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Online Members List */}
      {onlineMembers.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {onlineMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => handleMemberClick(member)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
            >
              {/* Avatar with online indicator */}
              <div className="relative flex-shrink-0">
                <Avatar 
                  user={member} 
                  size="sm" 
                  showBorder={true}
                />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full ${
                  isRealTimeActive ? 'animate-pulse' : ''
                }`}></div>
              </div>

              {/* Member info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {member.name}
                    {member.id === user?.id && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">(You)</span>
                    )}
                  </p>
                </div>
                
                <div className="flex items-center space-x-1 mt-1">
                  <ClockIcon className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Active {formatDistanceToNow(new Date(member.last_seen), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* View profile icon */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <EyeIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <UserGroupIcon className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No one is online</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Members will appear here when they're active
          </p>
        </div>
      )}
    </div>
  );
};

export default OnlineMembers; 