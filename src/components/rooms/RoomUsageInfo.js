import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  UserIcon, 
  CubeIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { roomUsageApi } from '../../services/api';

const RoomUsageInfo = ({ className = '', refreshTrigger = 0 }) => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const response = await roomUsageApi.getRoomUsageSummary();// Handle both response formats
      const usageData = response.usage || response.data?.usage || response;
      setUsage(usageData);
      setError(null);
    } catch (err) {
      console.error('Error fetching room usage:', err);
      setError('Failed to load usage information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-600 dark:text-red-400 text-sm ${className}`}>
        {error}
      </div>
    );
  }

  if (!usage) return null;

  const getSubscriptionColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'gold': return 'text-yellow-600 dark:text-yellow-400';
      case 'silver': return 'text-gray-500 dark:text-gray-400';
      case 'bronze': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getUsageColor = (used, limit) => {
    const ratio = used / limit;
    if (ratio >= 1) return 'text-red-600 dark:text-red-400';
    if (ratio >= 0.8) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
            <CubeIcon className="w-4 h-4 mr-2" />
            Room Usage
          </h3>
          <span className={`text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 ${getSubscriptionColor(usage.subscription_level)}`}>
            {usage.subscription_level?.toUpperCase() || 'BRONZE'}
          </span>
        </div>

        {/* Usage Stats */}
        <div className="space-y-3">
          {/* Monthly Usage */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">This Month</span>
              <span className={`font-medium ${getUsageColor(usage.rooms_used_this_month, usage.monthly_limit)}`}>
                {usage.rooms_used_this_month}/{usage.monthly_limit}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  usage.rooms_used_this_month >= usage.monthly_limit 
                    ? 'bg-red-500' 
                    : usage.rooms_used_this_month / usage.monthly_limit >= 0.8 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min((usage.rooms_used_this_month / usage.monthly_limit) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Remaining Free Rooms */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Free Rooms Left</span>
            <span className={`font-medium ${usage.remaining_free_rooms > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {usage.remaining_free_rooms}
            </span>
          </div>

          {/* Coins */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400 flex items-center">
              <CurrencyDollarIcon className="w-4 h-4 mr-1" />
              Coins
            </span>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {usage.user_coins?.toLocaleString() || 0}
            </span>
          </div>

          {/* Additional Room Cost */}
          {usage.remaining_free_rooms === 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Next Room Cost</span>
              <span className="font-medium text-orange-600 dark:text-orange-400">
                {usage.additional_room_cost} coins
              </span>
            </div>
          )}
        </div>

        {/* Status Message */}
        {usage.remaining_free_rooms === 0 && (
          <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="flex items-start">
              <InformationCircleIcon className="w-4 h-4 text-orange-500 dark:text-orange-400 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-xs text-orange-700 dark:text-orange-300">
                {usage.can_create_paid ? (
                  `You've used all free rooms this month. Additional rooms cost ${usage.additional_room_cost} coins each.`
                ) : (
                  `You need ${usage.additional_room_cost} coins to create additional rooms. Current balance: ${usage.user_coins} coins.`
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomUsageInfo; 