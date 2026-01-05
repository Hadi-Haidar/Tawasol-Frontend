import { coinService } from './coinService';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ActivityTracker {
  constructor() {
    this._isTracking = false;
    this.interval = null;
    this.pingInterval = 60000; // 60 seconds
    this.isVisible = true;
    this.lastActivityTime = Date.now();
    this.pingCount = 0;
    this.activityListeners = new Set();
    
    // Smart resume - simplified
    this.cycleStartTime = null;
    this.savedRemainingTime = null;
    
    // Session data
    this.currentSession = this.restoreSession() || {
      startTime: null,
      totalMinutes: 0,
      lastPingTime: null
    };
    // Restore remaining time if present (for refresh)
    const savedRemaining = localStorage.getItem('activityTracker_remainingTime');
    if (savedRemaining !== null) {
      this.savedRemainingTime = parseInt(savedRemaining, 10);
      localStorage.removeItem('activityTracker_remainingTime');
    }
    // Listen for page unload to save remaining time
    window.addEventListener('beforeunload', () => {
      if (this._isTracking && this.cycleStartTime) {
        const timeElapsed = Date.now() - this.cycleStartTime;
        const remaining = Math.max(0, this.pingInterval - timeElapsed);
        localStorage.setItem('activityTracker_remainingTime', remaining.toString());
      }
    });
  }

  /**
   * Save session data to localStorage
   */
  saveSession() {
    const sessionData = {
      ...this.currentSession,
      lastSaveTime: Date.now(),
      pingCount: this.pingCount,
      isTracking: this._isTracking,
      cycleStartTime: this.cycleStartTime,
      savedRemainingTime: this.savedRemainingTime
    };
    
    try {
      localStorage.setItem('activityTracker_session', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Restore session data from localStorage
   */
  restoreSession() {
    try {
      const sessionData = localStorage.getItem('activityTracker_session');
      if (!sessionData) return null;
      
      const parsed = JSON.parse(sessionData);
      const timeSinceLastSave = Date.now() - (parsed.lastSaveTime || 0);
      
      // Only restore if less than 1 hour old
      if (timeSinceLastSave > 60 * 60 * 1000) {
        localStorage.removeItem('activityTracker_session');
        return null;
      }
      
      // Restore data
      this.pingCount = parsed.pingCount || 0;
      this.cycleStartTime = parsed.cycleStartTime || null;
      this.savedRemainingTime = parsed.savedRemainingTime || null;
      
      return {
        startTime: parsed.startTime,
        totalMinutes: parsed.totalMinutes || 0,
        lastPingTime: parsed.lastPingTime
      };
    } catch (error) {
      console.error('Failed to restore session:', error);
      return null;
    }
  }

  /**
   * Clear session data from localStorage
   */
  clearSession() {
    try {
      localStorage.removeItem('activityTracker_session');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Add listener for activity updates
   */
  addActivityListener(callback) {
    this.activityListeners.add(callback);
  }

  /**
   * Remove activity listener
   */
  removeActivityListener(callback) {
    this.activityListeners.delete(callback);
  }

  /**
   * Notify all listeners of activity updates
   */
  notifyListeners(data) {
    this.activityListeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in activity listener:', error);
      }
    });
  }

  /**
   * Start tracking user activity
   */
  start() {
    if (this._isTracking || this.interval) return;
    
    this._isTracking = true;
    
    // Set session start time
    if (!this.currentSession.startTime) {
      this.currentSession.startTime = Date.now();
    }
    
    if (!this.currentSession.lastPingTime) {
      this.currentSession.lastPingTime = this.currentSession.startTime;
    }
    
    this.removeEventListeners();
    this.setupVisibilityTracking();
    this.setupUserActivityListeners();
    
    // Smart resume: use savedRemainingTime if present
    if (this.savedRemainingTime > 0) {
      this.startPeriodicPingWithResume({ remainingTime: this.savedRemainingTime });
      this.savedRemainingTime = null;
    } else {
      this.startPeriodicPing();
    }
    this.saveSession();
    
    this.notifyListeners({
      type: 'tracking_started',
      sessionStart: this.currentSession.startTime
    });
  }

  /**
   * Stop tracking user activity
   */
  stop() {
    if (!this._isTracking) return;
    
    this._isTracking = false;
    this.removeEventListeners();
    this.stopPeriodicPing();
    this.clearSession();
    
    this.notifyListeners({
      type: 'tracking_stopped',
      sessionDuration: this.currentSession.startTime ? Date.now() - this.currentSession.startTime : 0
    });
    
    // Reset session
    this.currentSession = {
      startTime: null,
      totalMinutes: 0,
      lastPingTime: null
    };
    this.pingCount = 0;
  }

  /**
   * Setup page visibility tracking
   */
  setupVisibilityTracking() {
    const handleVisibilityChange = () => {
      this.isVisible = !document.hidden;
      
      if (this.isVisible) {
        // User returned - smart resume
        this.lastActivityTime = Date.now();
        
        let resumeData = null;
        if (this.savedRemainingTime > 0) {
          resumeData = { remainingTime: this.savedRemainingTime };
        }
        
        this.startPeriodicPingWithResume(resumeData);
        this.savedRemainingTime = null;
        
        this.notifyListeners({
          type: 'visibility_changed',
          isVisible: true,
          timestamp: Date.now(),
          resumeData: resumeData
        });
      } else {
        // User left - save progress
        if (this.cycleStartTime) {
          const timeElapsed = Date.now() - this.cycleStartTime;
          this.savedRemainingTime = Math.max(0, this.pingInterval - timeElapsed);
        }
        
        this.stopPeriodicPing();
        this.saveSession();
        
        this.notifyListeners({
          type: 'visibility_changed',
          isVisible: false,
          timestamp: Date.now(),
          remainingTimeWhenLeft: this.savedRemainingTime
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    this.visibilityHandler = handleVisibilityChange;
  }

  /**
   * Setup user activity listeners (mouse, keyboard, scroll, etc.)
   */
  setupUserActivityListeners() {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'focus', 'keydown'];
    
    const handleUserActivity = (event) => {
      const now = Date.now();
      const timeSinceLastActivity = now - this.lastActivityTime;
      this.lastActivityTime = now;
      
      // Only notify every 5 seconds to prevent spam
      if (timeSinceLastActivity > 5000) {
        this.notifyListeners({
          type: 'user_activity',
          eventType: event.type,
          timestamp: now
        });
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    this.activityHandler = handleUserActivity;
    this.activityEvents = activityEvents;
  }

  /**
   * Remove all event listeners
   */
  removeEventListeners() {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (this.activityHandler && this.activityEvents) {
      this.activityEvents.forEach(event => {
        document.removeEventListener(event, this.activityHandler, true);
      });
      this.activityHandler = null;
      this.activityEvents = null;
    }
  }

  /**
   * Start periodic ping to backend
   */
  startPeriodicPing() {
    this.startPeriodicPingWithResume(null);
  }

  /**
   * Start periodic ping with optional smart resume
   */
  startPeriodicPingWithResume(resumeData = null) {
    if (this.interval) {
      this.stopPeriodicPing();
    }

    let firstPingDelay = this.pingInterval; // Default: 60 seconds

    if (resumeData && resumeData.remainingTime > 0) {
      // Smart resume: use saved time
      firstPingDelay = resumeData.remainingTime;
      // Adjust cycle start time
      this.cycleStartTime = Date.now() - (this.pingInterval - resumeData.remainingTime);
    } else {
      // Normal start
      this.cycleStartTime = Date.now();
    }

    // First ping with calculated delay
    this.firstPingTimeout = setTimeout(() => {
      this.pingBackend();
      
      // Start regular intervals
      this.interval = setInterval(() => {
        this.pingBackend();
      }, this.pingInterval);
    }, firstPingDelay);

    // Auto-save every 10 seconds
    this.sessionSaveInterval = setInterval(() => {
      if (this._isTracking) {
        this.saveSession();
      }
    }, 10000);
  }

  /**
   * Stop periodic ping
   */
  stopPeriodicPing() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    if (this.firstPingTimeout) {
      clearTimeout(this.firstPingTimeout);
      this.firstPingTimeout = null;
    }
    
    if (this.sessionSaveInterval) {
      clearInterval(this.sessionSaveInterval);
      this.sessionSaveInterval = null;
    }
  }

  /**
   * Ping the backend to record activity
   */
  async pingBackend() {
    // Check if should ping
    const timeSinceLastActivity = Date.now() - this.lastActivityTime;
    const sessionDuration = this.currentSession.startTime ? Date.now() - this.currentSession.startTime : 0;

    if (!this.isVisible) return;
    if (timeSinceLastActivity > 5 * 60 * 1000) return; // 5 minutes inactive
    if (sessionDuration < 30 * 1000) return; // Need 30s minimum
    if (this.pingCount === 0 && sessionDuration < 60000) return; // First ping needs full minute

    this.pingCount++;
    this.currentSession.lastPingTime = Date.now();
    this.cycleStartTime = Date.now(); // Reset for next cycle

    try {
      const response = await coinService.recordActivity(1);
      
      this.currentSession.totalMinutes = this.pingCount;
      const activityData = await this.getActivityData();
      
      this.notifyListeners({
        type: 'activity_recorded',
        pingCount: this.pingCount,
        sessionMinutes: this.currentSession.totalMinutes,
        timestamp: Date.now(),
        response: response,
        activityProgress: activityData
      });
      
      this.saveSession();
      
    } catch (error) {
      console.error('Activity ping failed:', error);
      this.notifyListeners({
        type: 'ping_failed',
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Get real-time activity data
   */
  async getActivityData() {
    try {
      const response = await coinService.checkAvailableRewards();
      if (response.success) {
        return response.data.activity_progress || {};
      }
      return {};
    } catch (error) {
      console.error('Error fetching activity data:', error);
      return {};
    }
  }

  /**
   * Get current tracking status
   */
  getStatus() {
    const now = Date.now();
    
    // Calculate remaining time in current cycle
    let timeInCurrentCycle = 0;
    let remainingTimeInCycle = this.pingInterval;
    
    if (this.cycleStartTime) {
      timeInCurrentCycle = now - this.cycleStartTime;
      remainingTimeInCycle = Math.max(0, this.pingInterval - timeInCurrentCycle);
    }
    
    return {
      isTracking: this._isTracking,
      isVisible: this.isVisible,
      lastActivityTime: this.lastActivityTime,
      timeSinceLastActivity: now - this.lastActivityTime,
      pingCount: this.pingCount,
      intervalActive: !!this.interval,
      remainingTimeInCycle: remainingTimeInCycle,
      session: {
        ...this.currentSession,
        duration: timeInCurrentCycle,
        timeSinceLastPing: this.currentSession.lastPingTime ? now - this.currentSession.lastPingTime : 0
      }
    };
  }

  /**
   * Get tracking status (public getter)
   */
  get isTracking() {
    return this._isTracking || false;
  }

  /**
   * Set tracking status (private setter)
   */
  set isTracking(value) {
    this._isTracking = value;
  }
}

// Create singleton instance
const activityTracker = new ActivityTracker();

// Make it available globally for debugging
window.activityTracker = activityTracker;

export default activityTracker; 