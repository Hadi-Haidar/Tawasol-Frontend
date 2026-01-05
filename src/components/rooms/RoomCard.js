import React from 'react';
import { 
  UsersIcon, 
  LockClosedIcon, 
  GlobeAltIcon, 
  ShieldCheckIcon,
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../common/Avatar';
import OptimizedImage from '../common/OptimizedImage';

const RoomCard = ({ room, onClick }) => {

  // Use membership data from room object (no API call needed)
  const isMember = room.membership?.is_member || false;
  const isOwner = room.membership?.is_owner || false;

  const getTypeIcon = () => {
    switch (room.type) {
      case 'public':
        return <GlobeAltIcon className="w-5 h-5 text-green-500" />;
      case 'private':
        return <LockClosedIcon className="w-5 h-5 text-orange-500" />;
      case 'secure':
        return <ShieldCheckIcon className="w-5 h-5 text-red-500" />;
      default:
        return <GlobeAltIcon className="w-5 h-5 text-green-500" />;
    }
  };

  const getTypeLabel = () => {
    switch (room.type) {
      case 'public':
        return 'Public';
      case 'private':
        return 'Private';
      case 'secure':
        return 'Secure';
      default:
        return 'Public';
    }
  };

  const getTypeBadgeColor = () => {
    switch (room.type) {
      case 'public':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'private':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'secure':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 cursor-pointer group"
    >
      {/* Room Image */}
      <div className="relative h-48 rounded-t-lg overflow-hidden">
        {room.image_url ? (
          <OptimizedImage
            src={room.image_url}
            alt={room.name}
            className="group-hover:scale-105 transition-transform duration-200"
            aspectRatio="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <div className="text-white text-4xl font-bold opacity-20">
              {room.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        
        {/* Commercial Badge */}
        {room.is_commercial && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <ShoppingBagIcon className="w-3 h-3 mr-1" />
              Commercial
            </span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor()}`}>
            {getTypeIcon()}
            <span className="ml-1">{getTypeLabel()}</span>
          </span>
        </div>
      </div>

      {/* Room Content */}
      <div className="p-6">
        {/* Room Name */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          {room.name}
        </h3>

        {/* Room Description */}
        {room.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {room.description}
          </p>
        )}

        {/* Room Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center">
            <UsersIcon className="w-4 h-4 mr-1" />
            <span>{room.members_count || 0} members</span>
          </div>
          
          <div className="flex items-center">
            <ClockIcon className="w-4 h-4 mr-1" />
            <span>{formatDistanceToNow(new Date(room.created_at), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Owner Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar 
              user={room.owner} 
              size="xs" 
              className="mr-2" 
              showBorder={false}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              by {room.owner?.name || 'Unknown'}
            </span>
          </div>

          {/* Member Status or Click to Join */}
          {isMember ? (
            <div className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-full">
              <CheckCircleIcon className="w-3 h-3 mr-1" />
              {isOwner ? 'You are Owner' : 'You are Member'}
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full">
              Click to {room.type === 'private' ? 'Request Join' : 'Join'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard; 