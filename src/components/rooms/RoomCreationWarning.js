import React from 'react';
import { 
  ExclamationTriangleIcon, 
  CurrencyDollarIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

const RoomCreationWarning = ({ 
  usageInfo, 
  onConfirm, 
  onCancel, 
  roomType = 'room' 
}) => {
  if (!usageInfo) return null;

  const willCostCoins = usageInfo.remaining_free_rooms === 0;
  const hasEnoughCoins = usageInfo.user_coins >= usageInfo.additional_room_cost;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center mb-4">
        {willCostCoins ? (
          <ExclamationTriangleIcon className="w-6 h-6 text-orange-500 dark:text-orange-400 mr-2" />
        ) : (
          <InformationCircleIcon className="w-6 h-6 text-blue-500 dark:text-blue-400 mr-2" />
        )}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {willCostCoins ? `${roomType === 'chat' ? 'Chat Room' : 'Room'} Creation Cost` : 'Create Free Room'}
        </h3>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Current Usage */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Usage</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {usageInfo.subscription_level?.toUpperCase() || 'BRONZE'} Plan
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {usageInfo.rooms_used_this_month}/{usageInfo.monthly_limit} used
            </span>
          </div>
        </div>

        {/* Warning/Info Message */}
        {willCostCoins ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 text-orange-500 dark:text-orange-400 mr-2" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Additional {roomType} cost
                </span>
              </div>
              <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                {usageInfo.additional_room_cost} coins
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Your balance:</span>
              <span className={`font-medium ${hasEnoughCoins ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {usageInfo.user_coins?.toLocaleString() || 0} coins
              </span>
            </div>

            {hasEnoughCoins && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">After creation:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {(usageInfo.user_coins - usageInfo.additional_room_cost)?.toLocaleString() || 0} coins
                </span>
              </div>
            )}

            {!hasEnoughCoins && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="text-sm text-red-700 dark:text-red-300">
                  <strong>Insufficient funds!</strong> You need {usageInfo.additional_room_cost - usageInfo.user_coins} more coins.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="text-sm text-green-700 dark:text-green-300">
              ✨ This {roomType} will be created for <strong>free</strong>! You have {usageInfo.remaining_free_rooms} free {roomType}s remaining this month.
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={willCostCoins && !hasEnoughCoins}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
            willCostCoins && !hasEnoughCoins
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : willCostCoins
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {willCostCoins 
            ? hasEnoughCoins 
              ? `Pay ${usageInfo.additional_room_cost} Coins & Create`
              : 'Insufficient Coins'
            : `Create Free ${roomType === 'chat' ? 'Chat Room' : 'Room'}`
          }
        </button>
      </div>
    </div>
  );
};

export default RoomCreationWarning; 