import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import activityTracker from '../services/activityTracker';
import onlineMembersApi from '../services/onlineMembersApi';
import websocketService from '../services/websocket';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in when app loads
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          
          // Set user immediately for better UX
          setUser(userData);
          
          // Always verify token with backend, especially after hard refresh
          try {
            const freshUserData = await authService.getCurrentUser();
            
            // Update user data with fresh data from backend
            const updatedUser = {
              ...userData,
              ...freshUserData,
              lastUpdated: Date.now()
            };
            
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            console.log('User auth type:', updatedUser.google_id ? 'google' : 'local');
            
            // Initialize WebSocket connection for real-time features
            if (token && !websocketService.isConnectedToSocket()) {
              websocketService.initialize(token);
            }
            
            // Start activity tracking for authenticated user (only if not already tracking)
            if (!activityTracker.isTracking) {
              activityTracker.start();
            }
          } catch (verifyError) {
            console.error('Token verification failed:', verifyError);
            
            // If verification fails, clear auth data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
          
        } catch (parseError) {
          console.error('Failed to parse saved user data:', parseError);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else if (token) {
        // If we have token but no saved user, verify with backend
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Initialize WebSocket connection for real-time features
          if (!websocketService.isConnectedToSocket()) {
            websocketService.initialize(token);
          }
          
          // Start activity tracking for authenticated user (only if not already tracking)
          if (!activityTracker.isTracking) {
            activityTracker.start();
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Initialize non-blocking operations in parallel (don't await them)
      Promise.all([
        // Refresh user profile in background (non-blocking)
        authService.refreshProfile().then(freshUserData => {
          const updatedUser = { ...freshUserData, lastUpdated: Date.now() };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }).catch(refreshError => {
          console.error('Refresh error:', refreshError);
        }),
        
        // Initialize WebSocket in background (non-blocking)
        new Promise(resolve => {
          if (response.token && !websocketService.isConnectedToSocket()) {
            try {
              websocketService.initialize(response.token);
            } catch (wsError) {
              console.error('WebSocket init error:', wsError);
            }
          }
          resolve();
        })
      ]).catch(error => {
        console.error('Parallel operations error:', error);
      });
      
      // Start activity tracking immediately (non-blocking)
      if (!activityTracker.isTracking) {
        try {
          activityTracker.start();
        } catch (activityError) {
          console.error('Activity tracker error:', activityError);
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authService.signup(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    // Clear local state first
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('currentRoomId'); // Clear current room tracking
    
    // Disconnect WebSocket connection
    if (websocketService.isConnectedToSocket()) {
      websocketService.disconnect();
    }
    
    // Stop activity tracking when user logs out
    activityTracker.stop();
    
    // Try to call the API logout endpoint, but don't wait for it
    authService.logout().catch(() => {
      // Ignore errors from the logout API call
    });
  };

  const forgotPassword = async (email) => {
    try {
      const response = await authService.forgotPassword(email);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (token, email, password, passwordConfirmation) => {
    try {
      const response = await authService.resetPassword(token, email, password, passwordConfirmation);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Google Authentication
  const googleLogin = () => {
    authService.googleAuth();
  };

  // Handle Google callback
  const handleGoogleCallback = async () => {
    try {
      const response = await authService.handleGoogleCallback();
      const userWithTimestamp = { ...response.user, lastUpdated: Date.now() };
      
      setUser(userWithTimestamp);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(userWithTimestamp));
      
      // Refresh Google users in background to ensure avatar consistency (non-blocking)
      authService.refreshProfile().then(freshUserData => {
        const updatedUser = { ...freshUserData, lastUpdated: Date.now() };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('Google user avatar info:', {
          avatarType: updatedUser.google_id ? 'google' : 
                     updatedUser.avatar?.startsWith('default:') ? 'default' : 'local',
          avatarChanged: userWithTimestamp.avatar !== updatedUser.avatar
        });
      }).catch(refreshError => {
        console.error('Profile refresh error:', refreshError);
      });
      
      // Initialize WebSocket connection in background (non-blocking)
      if (response.token && !websocketService.isConnectedToSocket()) {
        try {
          websocketService.initialize(response.token);
        } catch (wsError) {
          console.error('WebSocket initialization error:', wsError);
        }
      }
      
      // Start activity tracking immediately (non-blocking)
      if (!activityTracker.isTracking) {
        try {
          activityTracker.start();
        } catch (activityError) {
          console.error('Activity tracker start error:', activityError);
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Update user data
  const updateUser = (userData) => {
    const updatedUser = { 
      ...user, 
      ...userData,
      // Add timestamp for cache management
      lastUpdated: Date.now()
    };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Log avatar updates for debugging
    if (userData.avatar !== undefined) {
      console.log('Avatar update:', { newAvatar: userData.avatar });
    }
  };

  // Specialized method for avatar updates with immediate notification
  const updateUserAvatar = (newAvatarData) => {
    const updatedUser = {
      ...user,
      avatar: newAvatarData.avatar,
      lastUpdated: Date.now(),
      // Force update timestamp to trigger re-renders
      avatarUpdatedAt: Date.now()
    };
    
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    console.log('Avatar update applied:', { newAvatar: newAvatarData.avatar });
    
    // Force a small delay to ensure all components re-render
    setTimeout(() => {
      // Trigger a small state update to force component re-renders
      setUser(prev => ({ ...prev, _forceUpdate: Date.now() }));
    }, 50);
  };

  // Check if user data is stale (older than 5 minutes)
  const isUserDataStale = () => {
    if (!user || !user.lastUpdated) return true;
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return user.lastUpdated < fiveMinutesAgo;
  };

  // Smart refresh - only refresh if data is stale
  const smartRefreshUser = async () => {
    if (!user || !isUserDataStale()) return user;
    
    try {
      const freshUserData = await authService.refreshProfile();
      const updatedUser = { ...freshUserData, lastUpdated: Date.now() };
      updateUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Smart refresh error:', error);
      return user; // Return existing user if refresh fails
    }
  };

  // Force refresh user data (for manual triggers)
  const forceRefreshUser = async () => {
    if (!user) return null;
    
    try {
      const freshUserData = await authService.refreshProfile();
      const updatedUser = { ...freshUserData, lastUpdated: Date.now() };
      updateUser(updatedUser);
      console.log('Force refresh complete:', {
        authType: updatedUser.google_id ? 'google' : 'local'
      });
      
      return updatedUser;
    } catch (error) {
      console.error('Failed to force refresh user data:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    token: localStorage.getItem('token'),
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    googleLogin,
    handleGoogleCallback,
    updateUser,
    updateUserAvatar,
    smartRefreshUser,
    forceRefreshUser,
    isUserDataStale,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 