import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Coins, 
  Plus, 
  History, 
  Gift, 
  Clock,
  TrendingUp,
  Star,
  Sparkles,
  ArrowRight,
  Wallet,
  DollarSign,
  Award,
  Crown
} from 'lucide-react';
import { coinService } from '../services/coinService';
import { PageLoader } from '../components/ui/LoadingSpinner';

const CoinPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [availableRewards, setAvailableRewards] = useState({});
  const [activityProgress, setActivityProgress] = useState({});
  const [subscriptionLevel, setSubscriptionLevel] = useState('bronze');
  const [purchaseOptions, setPurchaseOptions] = useState([]);
  const [usdBalance, setUsdBalance] = useState(0);

  useEffect(() => {
    loadCoinData();
  }, []);

  const loadCoinData = async () => {
    try {
      setLoading(true);
      const [balanceData, rewardsData, purchaseData] = await Promise.all([
        coinService.getBalance(),
        coinService.checkAvailableRewards(),
        coinService.getPurchaseOptions()
      ]);

      if (balanceData.success) {
        setBalance(balanceData.data.current_balance);
        setTotalEarned(balanceData.data.total_earned);
        setTotalSpent(balanceData.data.total_spent);
        setRecentTransactions(balanceData.data.recent_transactions);
      }

      if (rewardsData.success) {
        setAvailableRewards(rewardsData.data.available_rewards);
        setActivityProgress(rewardsData.data.activity_progress || {});
        setSubscriptionLevel(rewardsData.data.subscription_level);
      }

      if (purchaseData.success) {
        setPurchaseOptions(purchaseData.data.purchase_options);
        setUsdBalance(purchaseData.data.current_balance_usd);
      }
    } catch (error) {
      console.error('Error loading coin data:', error);
    } finally {
      setLoading(false);
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
    return <PageLoader message="Loading your coins..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
              <Coins className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Your Coin Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Earn, spend, and manage your coins. Unlock premium features and rewards with our engaging coin system.
          </p>
        </div>

        {/* Balance Overview - Google Play Style */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-400 to-blue-400"></div>
            <svg className="absolute top-0 right-0 w-64 h-64 transform translate-x-16 -translate-y-16" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.1" />
              <circle cx="50" cy="50" r="25" fill="currentColor" opacity="0.1" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center">
                  {getSubscriptionIcon(subscriptionLevel)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Current Balance</h2>
                  <p className="text-gray-600 dark:text-gray-400 capitalize">{subscriptionLevel} Member</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                  {balance.toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-gray-400 flex items-center">
                  <Coins size={16} className="mr-1" />
                  coins
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">Total Earned</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{totalEarned.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="text-green-500" size={24} />
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Spent</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalSpent.toLocaleString()}</p>
                  </div>
                  <Wallet className="text-blue-500" size={24} />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">USD Balance</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">${usdBalance}</p>
                  </div>
                  <DollarSign className="text-purple-500" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Buy Coins */}
          <div 
            onClick={() => navigate('/user/coins/purchase')}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Plus className="text-white" size={24} />
              </div>
              <ArrowRight className="text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all duration-300" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Buy Coins</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Convert your USD balance to coins</p>
          </div>

          {/* Rewards */}
          <div 
            onClick={() => navigate('/user/coins/rewards')}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Gift className="text-white" size={24} />
              </div>
              <ArrowRight className="text-gray-400 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all duration-300" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Rewards</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Claim daily and activity rewards</p>
            {Object.values(availableRewards).some(reward => reward.available) && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <Sparkles size={12} className="mr-1" />
                  Available!
                </span>
              </div>
            )}
          </div>

          {/* Activity */}
          <div 
            onClick={() => navigate('/user/coins/activity')}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Clock className="text-white" size={24} />
              </div>
              <ArrowRight className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Activity</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Track your daily activity progress</p>
            {activityProgress.current_minutes !== undefined && (
              <div className="mt-2">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {activityProgress.current_minutes}/{activityProgress.required_minutes} minutes
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((activityProgress.current_minutes / activityProgress.required_minutes) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* History */}
          <div 
            onClick={() => navigate('/user/coins/history')}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <History className="text-white" size={24} />
              </div>
              <ArrowRight className="text-gray-400 group-hover:text-gray-500 group-hover:translate-x-1 transition-all duration-300" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">History</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">View all your transactions</p>
          </div>
        </div>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Transactions</h3>
            <div className="space-y-4">
              {recentTransactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      transaction.direction === 'in' 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : 'bg-red-100 dark:bg-red-900/20'
                    }`}>
                      {transaction.direction === 'in' ? (
                        <Plus className={`${transaction.direction === 'in' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} size={16} />
                      ) : (
                        <Coins className={`${transaction.direction === 'in' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} size={16} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{transaction.action}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.formatted_date}</p>
                    </div>
                  </div>
                  <div className={`text-lg font-semibold ${
                    transaction.direction === 'in' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.direction === 'in' ? '+' : '-'}{transaction.amount}
                  </div>
                </div>
              ))}
            </div>
            {recentTransactions.length > 3 && (
              <div className="mt-6 text-center">
                <button 
                  onClick={() => navigate('/user/coins/history')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                >
                  View All Transactions
                  <ArrowRight size={16} className="ml-2" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinPage; 