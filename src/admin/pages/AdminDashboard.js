import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import adminService from '../../services/adminService';
import { 
  TrendingUp,
  Users,
  MessageSquare,
  Home,
  CreditCard,
  Star,
  Eye,
  UserPlus,
  Calendar
} from 'lucide-react';

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

const AdminDashboard = () => {
  // Separate loading states for progressive loading
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    dailyRegistrations: 0,
    totalPosts: 0,
    totalRooms: 0,
    activeSubscriptions: 0,
    topRatedPosts: 0,
    dailyVisitors: 0,
    userPercentChange: 0,
    registrationPercentChange: 0,
    postsPercentChange: 0,
    subscriptionsPercentChange: 0
  });

  const [chartData, setChartData] = useState({
    visitorData: [],
    registrationData: []
  });

  const [engagingPosts, setEngagingPosts] = useState([]);

  // Progressive loading states
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load stats first (highest priority)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const analyticsResponse = await adminService.getDashboardAnalytics();
        
        setStatsData({
          totalUsers: analyticsResponse.data.total_users.count,
          dailyRegistrations: analyticsResponse.data.daily_registrations.count,
          totalPosts: analyticsResponse.data.total_posts.count,
          totalRooms: analyticsResponse.data.total_rooms,
          activeSubscriptions: analyticsResponse.data.active_subscriptions.count,
          topRatedPosts: analyticsResponse.data.top_rated_posts,
          dailyVisitors: analyticsResponse.data.daily_visitors,
          userPercentChange: analyticsResponse.data.total_users.percent_change,
          registrationPercentChange: analyticsResponse.data.daily_registrations.percent_change,
          postsPercentChange: analyticsResponse.data.total_posts.percent_change,
          subscriptionsPercentChange: analyticsResponse.data.active_subscriptions.percent_change
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load statistics.');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Load charts after stats (medium priority)
  useEffect(() => {
    const fetchCharts = async () => {
      try {
        setChartsLoading(true);
        
        // Load both charts in parallel but after stats
        const [visitorsResponse, registrationsResponse] = await Promise.all([
          adminService.getWeeklyVisitorsData(),
          adminService.getDailyRegistrationsData()
        ]);
        
        setChartData({
          visitorData: visitorsResponse.data,
          registrationData: registrationsResponse.data
        });
      } catch (err) {
        console.error('Error fetching charts:', err);
      } finally {
        setChartsLoading(false);
      }
    };

    // Delay chart loading slightly to let stats render first
    const timer = setTimeout(fetchCharts, 100);
    return () => clearTimeout(timer);
  }, []);

  // Load posts last (lowest priority)
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setPostsLoading(true);
        const engagingPostsResponse = await adminService.getMostEngagingPosts();
        setEngagingPosts(engagingPostsResponse.data);
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setPostsLoading(false);
      }
    };

    // Delay posts loading even more to prioritize above-the-fold content
    const timer = setTimeout(fetchPosts, 300);
    return () => clearTimeout(timer);
  }, []);

  // Optimized StatCard with loading state
  const StatCard = React.memo(({ title, value, icon: Icon, change, color = "blue", loading = false }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 min-h-[120px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20 mt-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mt-2"></div>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
              {change && (
                <p className={`text-sm mt-2 flex items-center ${
                  change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp size={16} className={`mr-1 ${change.type === 'decrease' ? 'rotate-180' : ''}`} />
                  {change.value}% from last week
                </p>
              )}
            </>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
          <Icon size={24} className={`text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </div>
  ));

  // Optimized LineChartCard with loading state
  const LineChartCard = React.memo(({ title, data, dataKey, color = '#3b82f6', loading = false }) => {
    // If no data, use default 7 days with 0 values
    const isEmpty = !data || data.length === 0 || (Array.isArray(data) && data.every(item => {
      if (title.includes('Visitors')) return !item.visitors;
      if (title.includes('Registrations')) return !item.registrations;
      return true;
    }));
    const defaultDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const chartConfig = React.useMemo(() => {
      if (isEmpty) {
        return {
          labels: defaultDays,
          datasets: [{
            label: title,
            data: Array(7).fill(0),
            borderColor: color,
            backgroundColor: `${color}20`,
            fill: true,
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          }],
        };
      }
      const labels = data.map(item => item.day || '');
      const values = data.map(item => {
        if (title.includes('Visitors')) {
          return item.visitors || 0;
        } else if (title.includes('Registrations')) {
          return item.registrations || 0;
        }
        return 0;
      });
      return {
        labels,
        datasets: [{
          label: title,
          data: values,
          borderColor: color,
          backgroundColor: `${color}20`,
          fill: true,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      };
    }, [data, title, color, isEmpty]);

    const chartOptions = React.useMemo(() => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false, // Disable animations for performance
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: color,
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          animation: false,
          callbacks: {
            label: (context) => `${title.includes('Visitors') ? 'Visitors' : 'Registrations'}: ${context.parsed.y}`
          }
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#6b7280', font: { size: 12 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(156, 163, 175, 0.2)' },
          ticks: { 
            color: '#6b7280', 
            font: { size: 12 },
            callback: (value) => Math.round(value)
          },
        },
      },
      elements: {
        point: { radius: 5, hoverRadius: 7, backgroundColor: color, borderColor: '#fff', borderWidth: 2 },
        line: { borderWidth: 3, tension: 0.4 },
      },
    }), [color, title]);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 min-h-[320px]">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 h-6">{title}</h3>
        <div className="h-64 relative">
          {loading ? (
            <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
              <div className="text-gray-400 dark:text-gray-500">Loading chart...</div>
            </div>
          ) : (
            <>
            <Line data={chartConfig} options={chartOptions} />
            </>
          )}
        </div>
      </div>
    );
  });

  // Only show loading for the initial page load
  if (statsLoading && chartsLoading && postsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening on your platform.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar size={16} />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={statsData.totalUsers.toLocaleString()}
          icon={Users}
          change={{ 
            type: statsData.userPercentChange >= 0 ? 'increase' : 'decrease', 
            value: Math.abs(statsData.userPercentChange || 0) 
          }}
          color="blue"
          loading={statsLoading}
        />
        <StatCard
          title="Daily Registrations"
          value={statsData.dailyRegistrations}
          icon={UserPlus}
          change={{ 
            type: statsData.registrationPercentChange >= 0 ? 'increase' : 'decrease', 
            value: Math.abs(statsData.registrationPercentChange || 0) 
          }}
          color="green"
          loading={statsLoading}
        />
        <StatCard
          title="Total Posts"
          value={statsData.totalPosts.toLocaleString()}
          icon={MessageSquare}
          change={{ 
            type: statsData.postsPercentChange >= 0 ? 'increase' : 'decrease', 
            value: Math.abs(statsData.postsPercentChange || 0) 
          }}
          color="purple"
          loading={statsLoading}
        />
        <StatCard
          title="Active Subscriptions"
          value={statsData.activeSubscriptions}
          icon={CreditCard}
          change={{ 
            type: statsData.subscriptionsPercentChange >= 0 ? 'increase' : 'decrease', 
            value: Math.abs(statsData.subscriptionsPercentChange || 0) 
          }}
          color="yellow"
          loading={statsLoading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Rooms"
          value={statsData.totalRooms}
          icon={Home}
          color="indigo"
          loading={statsLoading}
        />
        <StatCard
          title="Daily Visitors"
          value={statsData.dailyVisitors.toLocaleString()}
          icon={Eye}
          color="cyan"
          loading={statsLoading}
        />
        <StatCard
          title="Top Rated Posts"
          value={statsData.topRatedPosts}
          icon={Star}
          color="orange"
          loading={statsLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartCard
          title="Weekly Visitors"
          data={chartData.visitorData}
          dataKey="visitors"
          color="#3b82f6"
          loading={chartsLoading}
        />
        <LineChartCard
          title="Daily Registrations"
          data={chartData.registrationData}
          dataKey="registrations"
          color="#10b981"
          loading={chartsLoading}
        />
      </div>

      {/* Most Engaging Posts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 min-h-[300px]">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 h-6">Most Engaging Posts</h3>
        {postsLoading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-8"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-8"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {engagingPosts.length > 0 ? (
              engagingPosts.map((post, index) => (
              <div key={post.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{post.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      by {post.author?.name || 'Unknown'} in {post.room?.name || 'Unknown Room'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Star size={16} className="text-yellow-500" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare size={16} />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              No engaging posts found
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 