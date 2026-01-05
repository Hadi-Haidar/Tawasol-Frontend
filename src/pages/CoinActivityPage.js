import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity,
  Target,
  CheckCircle,
  Play,
  Pause,
  Timer,
  Plus
} from 'lucide-react';
import { coinService } from '../services/coinService';
import activityTracker from '../services/activityTracker';
import { PageLoader } from '../components/ui/LoadingSpinner';

const CoinActivityPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activityProgress, setActivityProgress] = useState({});
  const [isTracking, setIsTracking] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [nextMinuteCountdown, setNextMinuteCountdown] = useState(60);
  const [minuteAdded, setMinuteAdded] = useState(false);


  useEffect(() => {
    loadActivityData();
    
    // Activity tracker listener
    const handleActivityUpdate = (data) => {
      switch (data.type) {
        case 'tracking_started':
          setIsTracking(true);
          break;
          
        case 'tracking_stopped':
          setIsTracking(false);
          break;
          
        case 'visibility_changed':
          setIsVisible(data.isVisible);
          break;
          
        case 'activity_recorded':
          // Update progress and show animation
          if (data.activityProgress) {
            setActivityProgress(data.activityProgress);
            setMinuteAdded(true);
            setTimeout(() => setMinuteAdded(false), 2000);
          }
          break;
          
        case 'ping_failed':
          console.error('Activity ping failed:', data.error);
          break;
      }
    };

    activityTracker.addActivityListener(handleActivityUpdate);
    
    // Get initial status
    const initialStatus = activityTracker.getStatus();
    setIsTracking(initialStatus.isTracking);
    setIsVisible(initialStatus.isVisible);

    // Countdown timer - updates every second
    const timerInterval = setInterval(() => {
      const status = activityTracker.getStatus();
      
      // Update tracking state
      setIsTracking(status.isTracking);
      setIsVisible(status.isVisible);
      
      // Calculate countdown
      if (status.isTracking && status.isVisible) {
        if (status.pingCount === 0) {
          // First minute - use session duration
          const timeUntilFirstPing = Math.max(0, 60000 - status.session.duration);
          const countdown = Math.max(3, Math.ceil(timeUntilFirstPing / 1000));
          setNextMinuteCountdown(countdown);
        } else if (status.remainingTimeInCycle !== undefined) {
          // Subsequent minutes - use smart resume timing
          const countdown = Math.max(3, Math.ceil(status.remainingTimeInCycle / 1000));
          setNextMinuteCountdown(countdown);
        } else {
          setNextMinuteCountdown(60);
        }
      } else {
        setNextMinuteCountdown(60);
      }
    }, 1000);

    return () => {
      activityTracker.removeActivityListener(handleActivityUpdate);
      clearInterval(timerInterval);
    };
  }, []);

  const loadActivityData = async () => {
    try {
      setLoading(true);
      setActivityProgress({ current_minutes: 0, required_minutes: 30, remaining_minutes: 30, completed: false });
      
      const result = await coinService.checkAvailableRewards();
      
      if (result.success) {
        setActivityProgress(result.data.activity_progress || {});
      }
    } catch (error) {
      console.error('Error loading activity data:', error);
      setActivityProgress({ current_minutes: 0, required_minutes: 30, remaining_minutes: 30, completed: false });
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = useMemo(() => {
    if (!activityProgress.required_minutes) return 0;
    return Math.min((activityProgress.current_minutes / activityProgress.required_minutes) * 100, 100);
  }, [activityProgress.current_minutes, activityProgress.required_minutes]);

  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  }, []);

  if (loading) {
    return <PageLoader message="Loading activity tracker..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/user/coins')}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Tracker</h1>
            <p className="text-gray-600 dark:text-gray-400">Your daily activity is automatically tracked</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Tracking Status */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                isTracking 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {isTracking ? <Play size={16} /> : <Pause size={16} />}
                <span>{isTracking ? 'Tracking Active' : 'Tracking Stopped'}</span>
              </div>

              {/* Countdown Timer */}
              {isTracking && isVisible && (
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                  nextMinuteCountdown <= 3 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                    : nextMinuteCountdown <= 10 
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' 
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                }`}>
                  <Timer size={16} className={nextMinuteCountdown <= 10 ? 'animate-pulse' : ''} />
                  {nextMinuteCountdown <= 3 && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                  )}
                  <span>
                    {nextMinuteCountdown <= 3 
                      ? (activityProgress.current_minutes > 0 
                          ? 'Processing next minute...'
                          : 'Processing first minute...')
                      : (activityProgress.current_minutes > 0 
                          ? `Next minute in: ${nextMinuteCountdown}s`
                          : `First minute in: ${nextMinuteCountdown}s`)
                    }
                  </span>
                  {/* Progress indicator for first minute */}
                  {activityProgress.current_minutes === 0 && nextMinuteCountdown > 3 && (
                    <div className="ml-2 w-12 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-1000"
                        style={{ width: `${Math.min(95, ((60 - nextMinuteCountdown) / 60) * 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">

              
              {/* Minute Added Animation */}
              {minuteAdded && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-full text-sm font-medium animate-bounce">
                  <Plus size={16} />
                  <span>+1 minute added!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <Target className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Daily Progress</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className={`font-medium ${minuteAdded ? 'text-green-600 dark:text-green-400 animate-pulse' : ''}`}>
                    {activityProgress.current_minutes || 0}
                  </span>
                  /{activityProgress.required_minutes || 30} minutes
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Updated every minute while you're active
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold transition-all duration-300 ${
                activityProgress.completed 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-orange-600 dark:text-orange-400'
              } ${minuteAdded ? 'scale-110' : ''}`}>
                {activityProgress.completed ? 'Completed!' : `${activityProgress.remaining_minutes || 30} min left`}
              </div>
              {activityProgress.completed && (
                <div className="flex items-center justify-end text-green-600 dark:text-green-400 text-sm">
                  <CheckCircle size={16} className="mr-1" />
                  Ready for reward
                </div>
              )}
              {!activityProgress.completed && isTracking && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Next update in {nextMinuteCountdown}s
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div 
                className={`bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500 relative ${
                  minuteAdded ? 'animate-pulse' : ''
                }`}
                style={{ width: `${getProgressPercentage}%` }}
              >
                {getProgressPercentage > 0 && (
                  <div className="absolute inset-0 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
              <span>0 min</span>
              <span>15 min</span>
              <span>30 min (Goal)</span>
            </div>
            <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
              {isTracking && isVisible 
                ? (activityProgress.current_minutes > 0 
                    ? '🟢 Actively tracking - A minute is added every 60 seconds of active use'
                    : '🔵 Getting started - Stay active for 60 seconds to earn your first minute!')
                : isTracking 
                  ? '🟡 Tracking paused - Return to website to continue'
                  : '🔴 Not tracking - Activity must be started'
              }
            </div>
          </div>

          {/* Tracking Paused Notice */}
          {!isVisible && isTracking && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center space-x-3">
                <Pause className="text-orange-600 dark:text-orange-400" size={20} />
                <div>
                  <span className="font-medium text-orange-800 dark:text-orange-300">
                    Activity tracking paused
                  </span>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                    Return to this tab to continue tracking your activity time.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Activity className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Automatic Activity Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400">Your activity is tracked automatically when you use the platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinActivityPage; 