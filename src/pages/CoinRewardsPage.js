import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Gift, 
  Calendar,
  UserPlus,
  Clock,
  CheckCircle,
  Sparkles,
  Star,
  Trophy,
  Coins,
  Loader2,
  Award,
  Crown
} from 'lucide-react';
import { coinService } from '../services/coinService';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';

const CoinRewardsPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [rewards, setRewards] = useState({});
  const [activityProgress, setActivityProgress] = useState({});
  const [subscriptionLevel, setSubscriptionLevel] = useState('bronze');
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    loadRewardsData();
  }, []);

  const loadRewardsData = async () => {
    try {
      setLoading(true);
      const [rewardsData, balanceData] = await Promise.all([
        coinService.checkAvailableRewards(),
        coinService.getBalance()
      ]);

      if (rewardsData.success) {
        setRewards(rewardsData.data.available_rewards);
        setActivityProgress(rewardsData.data.activity_progress || {});
        setSubscriptionLevel(rewardsData.data.subscription_level);
        setCurrentBalance(rewardsData.data.current_balance);
      }

      if (balanceData.success) {
        setCurrentBalance(balanceData.data.current_balance);
      }
    } catch (error) {
      console.error('Error loading rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (rewardType) => {
    try {
      setClaiming(rewardType);
      let result;
      let rewardName = '';
      let coinAmount = 0;

      switch (rewardType) {
        case 'daily_login':
          result = await coinService.claimDailyLoginReward();
          rewardName = 'Daily login reward';
          coinAmount = rewards.daily_login?.amount || 5;
          break;
        case 'registration':
          result = await coinService.claimRegistrationReward();
          rewardName = 'Welcome bonus';
          coinAmount = rewards.registration?.amount || 15;
          break;
        case 'activity':
          result = await coinService.claimActivityReward();
          rewardName = 'Activity reward';
          coinAmount = rewards.activity?.amount || 10;
          break;
        default:
          throw new Error('Invalid reward type');
      }

      if (result.success) {
        // Refresh rewards data
        await loadRewardsData();
        
        // Show beautiful success toast with coin amount
        showSuccess(`${rewardName} claimed! You earned ${coinAmount} coins 🎉`);
      } else {
        showError(result.message || 'Failed to claim reward. Please try again.');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      showError(error.message || 'Failed to claim reward. Please try again.');
    } finally {
      setClaiming(null);
    }
  };

  const getSubscriptionIcon = (level) => {
    switch (level) {
      case 'bronze': return <Award className="w-10 h-10 text-orange-600" />;
      case 'silver': return <Star className="w-10 h-10 text-gray-500" />;
      case 'gold': return <Crown className="w-10 h-10 text-yellow-500" />;
      default: return <Award className="w-10 h-10 text-gray-400" />;
    }
  };

  if (loading) {
    return <PageLoader message="Loading rewards..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/user/coins')}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rewards Center</h1>
            <p className="text-gray-600 dark:text-gray-400">Claim your daily rewards and bonuses</p>
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center">
                {getSubscriptionIcon(subscriptionLevel)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Balance</h3>
                <p className="text-gray-600 dark:text-gray-400 capitalize">{subscriptionLevel} Member</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                {currentBalance.toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400 flex items-center justify-end">
                <Coins size={16} className="mr-1" />
                coins
              </div>
            </div>
          </div>
        </div>

        {/* Activity Progress */}
        {activityProgress.current_minutes !== undefined && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <Clock className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Activity Progress</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {activityProgress.current_minutes}/{activityProgress.required_minutes} minutes completed
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${activityProgress.completed ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {activityProgress.completed ? 'Completed!' : `${activityProgress.remaining_minutes} min remaining`}
                </div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min((activityProgress.current_minutes / activityProgress.required_minutes) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Reward Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Daily Login Reward */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full transform translate-x-16 -translate-y-16"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <Calendar className="text-white" size={24} />
                </div>
                {rewards.daily_login?.available && (
                  <div className="flex items-center space-x-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded-full text-xs">
                    <Sparkles size={12} />
                    <span>Available</span>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Daily Login</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Login every day to earn coins
              </p>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <Coins className="text-green-600 dark:text-green-400" size={20} />
                  <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {rewards.daily_login?.amount || 5}
                  </span>
                  <span className="text-green-600 dark:text-green-400">coins</span>
                </div>
              </div>

              <button
                onClick={() => claimReward('daily_login')}
                disabled={!rewards.daily_login?.available || claiming === 'daily_login'}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                  rewards.daily_login?.available && claiming !== 'daily_login'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {claiming === 'daily_login' ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Claiming...</span>
                  </>
                ) : rewards.daily_login?.available ? (
                  <>
                    <Gift size={16} />
                    <span>Claim Reward</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Already Claimed</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Registration Reward */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full transform translate-x-16 -translate-y-16"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                  <UserPlus className="text-white" size={24} />
                </div>
                {rewards.registration?.available && (
                  <div className="flex items-center space-x-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded-full text-xs">
                    <Sparkles size={12} />
                    <span>Available</span>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome Bonus</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                One-time bonus for new users
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <Coins className="text-blue-600 dark:text-blue-400" size={20} />
                  <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {rewards.registration?.amount || 15}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">coins</span>
                </div>
              </div>

              <button
                onClick={() => claimReward('registration')}
                disabled={!rewards.registration?.available || claiming === 'registration'}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                  rewards.registration?.available && claiming !== 'registration'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {claiming === 'registration' ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Claiming...</span>
                  </>
                ) : rewards.registration?.available ? (
                  <>
                    <Gift size={16} />
                    <span>Claim Bonus</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Already Claimed</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Activity Reward */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full transform translate-x-16 -translate-y-16"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <Clock className="text-white" size={24} />
                </div>
                {rewards.activity?.available && (
                  <div className="flex items-center space-x-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded-full text-xs">
                    <Sparkles size={12} />
                    <span>Available</span>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Activity Reward</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Complete 30 minutes of daily activity
              </p>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <Coins className="text-purple-600 dark:text-purple-400" size={20} />
                  <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {rewards.activity?.amount || 10}
                  </span>
                  <span className="text-purple-600 dark:text-purple-400">coins</span>
                </div>
                <div className="text-center text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {subscriptionLevel} tier reward
                </div>
              </div>

              {!rewards.activity?.requirements_met && (
                <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm p-3 rounded-lg mb-4">
                  Need {activityProgress.remaining_minutes || 30} more minutes of activity
                </div>
              )}

              <button
                onClick={() => claimReward('activity')}
                disabled={!rewards.activity?.available || claiming === 'activity'}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                  rewards.activity?.available && claiming !== 'activity'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {claiming === 'activity' ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Claiming...</span>
                  </>
                ) : rewards.activity?.available ? (
                  <>
                    <Gift size={16} />
                    <span>Claim Reward</span>
                  </>
                ) : rewards.activity?.already_claimed ? (
                  <>
                    <CheckCircle size={16} />
                    <span>Already Claimed</span>
                  </>
                ) : (
                  <>
                    <Clock size={16} />
                    <span>Complete Activity</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/user/coins/activity')}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <Clock className="text-blue-600 dark:text-blue-400" size={20} />
                <span className="font-medium text-gray-900 dark:text-white">Track Activity</span>
              </div>
              <span className="text-gray-600 dark:text-gray-400">→</span>
            </button>

            <button
              onClick={() => navigate('/user/coins/history')}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <Trophy className="text-gray-600 dark:text-gray-400" size={20} />
                <span className="font-medium text-gray-900 dark:text-white">View History</span>
              </div>
              <span className="text-gray-600 dark:text-gray-400">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinRewardsPage; 