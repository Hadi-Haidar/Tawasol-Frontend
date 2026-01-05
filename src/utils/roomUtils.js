// Utility functions for room-related operations

/**
 * Check if a user is a member of a room
 * @param {Object} room - Room object with members data
 * @param {string|number} userId - User ID to check
 * @returns {boolean} - True if user is a member
 */
export const checkUserMembership = (room, userId) => {
  if (!room || !userId) return false;
  
  // Check in members array with different possible structures
  if (room.members?.some(member => 
    (member.user?.id || member.user_id || member.id) === userId
  )) {
    return true;
  }
  
  // Check in member_ids array
  if (room.member_ids?.includes(userId)) {
    return true;
  }
  
  return false;
};

/**
 * Check if a user is the owner of a room
 * @param {Object} room - Room object
 * @param {string|number} userId - User ID to check
 * @returns {boolean} - True if user is the owner
 */
export const checkUserOwnership = (room, userId) => {
  if (!room || !userId) return false;
  return room.owner_id === userId || room.owner?.id === userId;
};

/**
 * Get the join button text based on room type
 * @param {string} roomType - Type of room (public, private, secure)
 * @param {boolean} loading - Whether a join action is in progress
 * @returns {string} - Button text
 */
export const getJoinButtonText = (roomType, loading = false) => {
  if (loading) {
    switch (roomType) {
      case 'private':
        return 'Sending Request...';
      case 'secure':
        return 'Joining...';
      default:
        return 'Joining...';
    }
  }
  
  switch (roomType) {
    case 'private':
      return 'Send Join Request';
    case 'secure':
      return 'Enter Password';
    default:
      return 'Join Room';
  }
};

/**
 * Get room type information with styling
 * @param {string} roomType - Type of room
 * @returns {Object} - Object with color, icon, and label
 */
export const getRoomTypeInfo = (roomType) => {
  switch (roomType) {
    case 'public':
      return {
        color: 'green',
        bgColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        label: 'Public',
        description: 'Anyone can join'
      };
    case 'private':
      return {
        color: 'orange',
        bgColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        label: 'Private',
        description: 'Requires approval'
      };
    case 'secure':
      return {
        color: 'red',
        bgColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        label: 'Secure',
        description: 'Password protected'
      };
    default:
      return {
        color: 'gray',
        bgColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        label: 'Unknown',
        description: 'Unknown type'
      };
  }
}; 