import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  History, 
  Filter,
  Plus,
  Minus,
  Coins,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { coinService } from '../services/coinService';
import { PageLoader } from '../components/ui/LoadingSpinner';

const CoinHistoryPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [filterType, setFilterType] = useState('all'); // all, earned, spent
  const [stats, setStats] = useState({
    current_balance: 0,
    total_earned: 0,
    total_spent: 0
  });

  useEffect(() => {
    loadTransactionHistory();
  }, [currentPage, perPage]);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const balanceResult = await coinService.getBalance();
      if (balanceResult.success && balanceResult.data) {
        setStats({
          current_balance: balanceResult.data.current_balance || 0,
          total_earned: balanceResult.data.total_earned || 0,
          total_spent: balanceResult.data.total_spent || 0
        });
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadTransactionHistory = async () => {
    try {
      setLoading(true);
      
      // Get transaction history
      const historyResult = await coinService.getTransactionHistory(currentPage, perPage);

      if (historyResult.success && historyResult.data) {
        const transactionData = historyResult.data;
        
        // Handle both paginated and direct array responses
        if (transactionData.data) {
          // Paginated response
          setTransactions(transactionData.data || []);
          setTotalPages(transactionData.last_page || 1);
        } else if (Array.isArray(transactionData)) {
          // Direct array response
          setTransactions(transactionData);
          setTotalPages(1);
        } else {
          setTransactions([]);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (transaction) => {
    return transaction.direction === 'in' ? (
      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
        <Plus className="text-green-600 dark:text-green-400" size={16} />
      </div>
    ) : (
      <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
        <Minus className="text-red-600 dark:text-red-400" size={16} />
      </div>
    );
  };

  const getTransactionColor = (transaction) => {
    return transaction.direction === 'in' 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  const getActionDescription = (action) => {
    const actionMap = {
      'daily_login': 'Daily Login Reward',
      'first_registration': 'Welcome Bonus',
      'activity_reward': 'Activity Reward',
      'purchase_100_coins': 'Coin Purchase (100)',
      'purchase_200_coins': 'Coin Purchase (200)',
      'purchase_300_coins': 'Coin Purchase (300)',
      'purchase_400_coins': 'Coin Purchase (400)',
      'purchase_500_coins': 'Coin Purchase (500)',
      'feature_unlock': 'Feature Unlock',
      'premium_feature': 'Premium Feature',
      'subscription_discount': 'Subscription Discount'
    };
    return actionMap[action] || action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ');
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'earned' && transaction.direction === 'in') ||
                         (filterType === 'spent' && transaction.direction === 'out');
    return matchesFilter;
  });

  if (loading) {
    return <PageLoader message="Loading transaction history..." />;
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
            <p className="text-gray-600 dark:text-gray-400">View all your coin transactions and activities</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Current Balance</h3>
                <div className="flex items-center space-x-2">
                  <Coins className="text-purple-500" size={20} />
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.current_balance?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                <Coins className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Total Earned</h3>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="text-green-500" size={20} />
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.total_earned?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <TrendingUp className="text-white" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Total Spent</h3>
                <div className="flex items-center space-x-2">
                  <TrendingDown className="text-red-500" size={20} />
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.total_spent?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                <TrendingDown className="text-white" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-500" size={20} />
              <span className="text-gray-700 dark:text-gray-300 font-medium">Filter by:</span>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'earned', label: 'Earned' },
                  { key: 'spent', label: 'Spent' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterType(filter.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      filterType === filter.key
                        ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Items per page */}
            <select
              value={perPage}
              onChange={(e) => setPerPage(parseInt(e.target.value))}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-900 dark:text-white"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {filteredTransactions.length > 0 ? (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <div className="col-span-1">Type</div>
                  <div className="col-span-4">Description</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-3">Date</div>
                  <div className="col-span-2">Notes</div>
                </div>
              </div>

              {/* Transaction Rows */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Type Icon */}
                      <div className="col-span-1">
                        {getTransactionIcon(transaction)}
                      </div>

                      {/* Description */}
                      <div className="col-span-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {getActionDescription(transaction.action)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {transaction.id}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="col-span-2">
                        <div className={`text-lg font-semibold ${getTransactionColor(transaction)}`}>
                          {transaction.direction === 'in' ? '+' : '-'}{transaction.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">coins</div>
                      </div>

                      {/* Date */}
                      <div className="col-span-3">
                        <div className="text-gray-900 dark:text-white">
                          {transaction.formatted_date}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {transaction.notes || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-white dark:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                              currentPage === pageNumber
                                ? 'bg-purple-600 text-white'
                                : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-white dark:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <History className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {filterType !== 'all' 
                  ? 'Try adjusting your filter criteria.' 
                  : 'Start earning and spending coins to see your transaction history.'}
              </p>
              <button
                onClick={() => navigate('/user/coins/rewards')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
              >
                <Eye size={16} className="mr-2" />
                View Available Rewards
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoinHistoryPage; 