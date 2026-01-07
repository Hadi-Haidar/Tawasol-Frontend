import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp,
  MessageSquare,
  Store,
  Eye,
  Edit,
  Star,
  Package,
  ShoppingCart,
  AlertTriangle,
  DollarSign,
  Award,
  Globe,
  Lock,
  RefreshCw
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import apiService from '../services/apiService';
import activityTracker from '../services/activityTracker';
import { formatDistanceToNow } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    activity: {
      minutesToday: 0,
      lastActive: null,
      weeklyData: []
    },
    posts: {
      total: 0,
      roomPosts: 0,
      publicPosts: 0,
      totalLikes: 0,
      recent: []
    },
    store: {
      totalProducts: 0,
      roomProducts: 0,
      storeProducts: 0,
      orders: 0,
      monthlyOrders: 0,
      revenue: 0,
      lowStock: 0,
      recentOrders: []
    }
  });
  const [userBalance, setUserBalance] = useState({
    coins: 0,
    balance: 0,
    subscriptionLevel: null
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    fetchDashboardData();
    fetchUserBalance();
    
    // Setup activity tracking listener
    const handleActivityUpdate = (activityData) => {
      if (activityData.type === 'activity_ping') {
        fetchActivityData();
        fetchUserBalance();
      }
    };
    
    activityTracker.addActivityListener(handleActivityUpdate);
    
    // Listen for subscription upgrades
    const handleSubscriptionUpdate = (event) => {
      fetchUserBalance();
      fetchDashboardData();
      if (event.detail?.newLevel) {
        setLastUpdate(Date.now());
      }
    };
    
    window.addEventListener('subscriptionUpdated', handleSubscriptionUpdate);
    
    return () => {
      activityTracker.removeActivityListener(handleActivityUpdate);
      window.removeEventListener('subscriptionUpdated', handleSubscriptionUpdate);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/user/dashboard');
      
      if (response.success) {
        setDashboardData({
          activity: response.activity,
          posts: response.posts,
          store: response.store
        });
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
      
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityData = async () => {
    try {
      const response = await apiService.get('/user/activity');
      if (response.success) {
        setDashboardData(prev => ({
          ...prev,
          activity: response.activity
        }));
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const [coinsResponse, balanceResponse] = await Promise.allSettled([
        apiService.get('/user/coins/balance'),
        apiService.get('/user/subscription/balance')
      ]);
      
      let coins = 0;
      let balance = 0;
      let subscriptionLevel = null;
      
      if (coinsResponse.status === 'fulfilled' && coinsResponse.value.success) {
        coins = coinsResponse.value.data?.current_balance || 0;
      }
      
      if (balanceResponse.status === 'fulfilled' && balanceResponse.value.success) {
        balance = parseFloat(balanceResponse.value.balance) || 0;
        subscriptionLevel = balanceResponse.value.subscription_level;
      }
      
      setUserBalance({ coins, balance, subscriptionLevel });
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  const getSubscriptionBadge = () => {
    const subscription = userBalance.subscriptionLevel || user?.subscription_level || user?.subscription_type || 'bronze';
    const badgeColors = {
      free: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300',
      bronze: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
      silver: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-600 dark:text-gray-200',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400',
      premium: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColors[subscription] || badgeColors.bronze}`}>
        <Award className="w-3 h-3 mr-1" />
        {subscription.charAt(0).toUpperCase() + subscription.slice(1)}
      </span>
    );
  };

  // Responsive Chart Component
  const WeeklyChart = React.memo(({ data }) => {
    const isEmpty = !data || data.length === 0;
    const defaultDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const chartData = isEmpty
      ? {
          labels: defaultDays,
          datasets: [{
            label: 'Daily Activity',
            data: Array(7).fill(0),
            borderColor: '#6366f1',
            backgroundColor: '#6366f120',
            fill: true,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4,
          }],
        }
      : {
      labels: data.map(item => item.day),
      datasets: [{
        label: 'Daily Activity',
        data: data.map(item => item.minutes),
        borderColor: '#6366f1',
        backgroundColor: '#6366f120',
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
      }],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#6366f1',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          animation: false,
          callbacks: {
            label: (context) => `Activity: ${context.parsed.y} minutes`
          }
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { 
            color: '#6b7280', 
            font: { size: window.innerWidth < 640 ? 10 : 12 },
            maxRotation: window.innerWidth < 640 ? 45 : 0,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(156, 163, 175, 0.2)' },
          ticks: { 
            color: '#6b7280', 
            font: { size: window.innerWidth < 640 ? 10 : 12 },
            callback: (value) => Math.round(value) + 'm'
          },
        },
      },
      elements: {
        point: { 
          radius: window.innerWidth < 640 ? 3 : 4, 
          hoverRadius: window.innerWidth < 640 ? 5 : 6,
          backgroundColor: '#6366f1', 
          borderColor: '#fff', 
          borderWidth: 2 
        },
        line: { borderWidth: window.innerWidth < 640 ? 2 : 3, tension: 0.4 },
      },
    };

    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-4 relative">
        <Line data={chartData} options={chartOptions} />
      </div>
    );
  });

  const handleEditPost = (postId) => {
    window.location.href = `/user/posts?edit=${postId}`;
  };

  const handleViewPost = (postId) => {
    window.location.href = `/user/posts?view=${postId}`;
  };

  const refreshData = async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchUserBalance()
    ]);
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4 sm:space-y-6 md:space-y-8">
            {/* Welcome Section Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 sm:w-48"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 sm:w-32"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-4 sm:space-x-6">
                  <div className="text-center">
                    <div className="h-6 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded w-12 sm:w-16 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8 sm:w-12 mx-auto"></div>
                  </div>
                  <div className="text-center">
                    <div className="h-6 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded w-16 sm:w-20 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-10 sm:w-14 mx-auto"></div>
                  </div>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>

            {/* Main Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 min-h-[300px] sm:min-h-[400px]">
                <div className="space-y-4">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 sm:w-48"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-40 sm:h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mt-4"></div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 min-h-[300px] sm:min-h-[400px]">
                <div className="space-y-4">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 sm:w-32"></div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="h-14 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-14 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="h-14 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-14 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Summary Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 sm:w-32 mb-4 sm:mb-6"></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="text-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2"></div>
                    <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-600 rounded w-10 sm:w-12 mx-auto mb-1"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 sm:w-20 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section - Responsive */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left: Avatar & Welcome */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Avatar user={user} size="xl" showBorder />
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    Welcome back, {user?.name || 'Ahmad'}! 👋
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                    {getSubscriptionBadge()}
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      User Type: {user?.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Right: Coins, Balance & Refresh */}
              <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-6">
                <div className="text-center min-w-[50px] sm:min-w-[60px]">
                  <div className="flex items-center justify-center text-base sm:text-lg font-semibold text-yellow-600 dark:text-yellow-500 h-6 sm:h-7">
                    🪙 <span className="min-w-[30px] sm:min-w-[40px] text-right">{userBalance.coins}</span>
                  </div>
                  <p className="text-xs text-gray-500">Coins</p>
                </div>
                <div className="text-center min-w-[70px] sm:min-w-[80px]">
                  <div className="flex items-center justify-center text-base sm:text-lg font-semibold text-green-600 dark:text-green-500 h-6 sm:h-7">
                    💰 <span className="min-w-[50px] sm:min-w-[60px] text-right">${userBalance.balance.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500">Balance</p>
                </div>
                <button
                  onClick={refreshData}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center touch-manipulation"
                  title="Refresh Dashboard"
                  aria-label="Refresh Dashboard"
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 md:mb-8">
          {/* User Activity Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 min-h-[300px] sm:min-h-[400px]">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">User Activity Overview</h2>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total minutes active today:</span>
                <span className="font-medium text-gray-900 dark:text-white min-w-[30px] text-right">{dashboardData.activity.minutesToday}</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Last active time:</span>
                <span className="font-medium text-gray-900 dark:text-white min-w-[80px] text-right text-xs">
                  {dashboardData.activity.lastActive ? formatDistanceToNow(new Date(dashboardData.activity.lastActive)) + ' ago' : 'Now'}
                </span>
              </div>
              <div className="mt-3 sm:mt-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">Weekly line chart: Minutes per day</h3>
                <div className="h-40 sm:h-48">
                  <WeeklyChart data={dashboardData.activity.weeklyData} />
                </div>
              </div>
            </div>
          </div>

          {/* My Posts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 min-h-[300px] sm:min-h-[400px]">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">My Posts</h2>
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="text-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{dashboardData.posts.roomPosts}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">Room Posts</p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{dashboardData.posts.publicPosts}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">Public Posts</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Table display:</h3>
                {dashboardData.posts.recent.length > 0 ? (
                  dashboardData.posts.recent.slice(0, 3).map((post) => (
                    <div key={post.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                          Title: {post.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5">
                          <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${
                            post.combined_status === 'in_public' || (post.status === 'published' && post.visibility === 'public')
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {post.combined_status === 'in_public' || (post.status === 'published' && post.visibility === 'public') ? (
                              <><Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />Status: In Public</>
                            ) : (
                              <><Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />Status: In Room</>
                            )}
                          </span>
                          <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${
                            post.visibility === 'public'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                          }`}>
                            Visibility: {post.visibility === 'public' ? (
                              <><Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />Public</>
                            ) : (
                              <><Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />Private</>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
                        <span className="flex items-center text-[10px] sm:text-xs text-gray-500">
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          Likes: {post.likes}
                        </span>
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => handleEditPost(post.id)}
                            className="p-1.5 sm:p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation" 
                            title="Edit"
                            aria-label="Edit post"
                          >
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button 
                            onClick={() => handleViewPost(post.id)}
                            className="p-1.5 sm:p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors touch-manipulation" 
                            title="View"
                            aria-label="View post"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 sm:py-8 text-sm text-gray-500 dark:text-gray-400">
                    No posts yet. Create your first post!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Store Summary - Responsive Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Store Summary</h2>
            <Store className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.store.totalProducts}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Products count</p>
              <div className="text-[10px] sm:text-xs text-gray-500 mt-1 space-y-0.5">
                <p className="flex items-center justify-center">
                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  {dashboardData.store.roomProducts} room
                </p>
                <p className="flex items-center justify-center">
                  <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  {dashboardData.store.storeProducts} public
                </p>
              </div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
              <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.store.monthlyOrders || dashboardData.store.orders}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Orders count</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">This month</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">${dashboardData.store.revenue}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Revenue this month</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">From all sales</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.store.lowStock}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Low stock warning</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Needs attention</p>
            </div>
          </div>
        </div>

        {/* Last Updated Info */}
        <div className="mt-3 sm:mt-4 text-center">
          <p className="text-[10px] sm:text-xs text-gray-500">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
