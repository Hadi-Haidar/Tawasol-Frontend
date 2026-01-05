import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import RoomPosts from '../../posts/RoomPosts';

const RoomPostsTab = ({ room, user, isMember, isOwner }) => {
  const { token } = useAuth();
  const [userRole, setUserRole] = useState('member');

  useEffect(() => {
    if (isOwner) {
      setUserRole('owner');
    } else if (isMember && room?.members) {
      // Find user's role in the room
      const membership = room.members.find(
        member => (member.user?.id || member.user_id || member.id) === user?.id
      );
      setUserRole(membership?.role || 'member');
    }
  }, [isOwner, isMember, room, user]);

  if (!isMember && !isOwner) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Access Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be a member of this room to view and interact with posts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <RoomPosts 
        roomId={room?.id} 
        room={room}
        userRole={userRole}
      />
    </div>
  );
};

export default RoomPostsTab; 