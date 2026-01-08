import React from 'react';
import { 
  UserGroupIcon
} from '@heroicons/react/24/outline';
import Avatar from '../common/Avatar';

const OnlineMembers = ({ room, user, onMemberClick }) => {
  // Empty state - no online members functionality
  const onlineMembers = [];

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <UserGroupIcon className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Online Members
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {onlineMembers.length}
          </span>
        </div>
      </div>

      {/* Online Members List - Empty State */}
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <UserGroupIcon className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No one is online</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Members will appear here when they're active
        </p>
      </div>
    </div>
  );
};

export default OnlineMembers;
