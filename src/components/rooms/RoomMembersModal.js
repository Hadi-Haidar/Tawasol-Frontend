import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import Avatar from '../common/Avatar';
import apiService from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';

const RoomMembersModal = ({ room, isOpen, onClose }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    if (isOpen && room?.id) {
      fetchRoomMembers();
    }
  }, [isOpen, room?.id]);

  const fetchRoomMembers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/rooms/${room.id}/members`);
      
      if (response.success) {
        setMembers(response.members || []);
        setRoomData(response.room || {});
      }
    } catch (error) {
      console.error('Error fetching room members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search members
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') {
      return matchesSearch;
    } else if (activeTab === 'staff') {
      // Include moderators and owner
      const isStaff = member.role === 'moderator' || member.user.id === roomData?.owner?.id;
      return matchesSearch && isStaff;
    }
    
    return matchesSearch;
  });

  // Add owner to the list if not already included
  const allMembersIncludingOwner = () => {
    if (!roomData?.owner) return filteredMembers;
    
    // Check if owner is already in members list
    const ownerInMembers = members.some(member => member.user.id === roomData.owner.id);
    
    if (!ownerInMembers) {
      // Create owner object in same format as members
      const ownerAsMember = {
        user: roomData.owner,
        role: 'owner',
        status: 'approved',
        user_id: roomData.owner.id
      };
      
      // Add owner at the beginning and filter
      const allMembers = [ownerAsMember, ...members];
      return allMembers.filter(member => {
        const matchesSearch = member.user.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (activeTab === 'all') {
          return matchesSearch;
        } else if (activeTab === 'staff') {
          const isStaff = member.role === 'moderator' || member.role === 'owner';
          return matchesSearch && isStaff;
        }
        
        return matchesSearch;
      });
    }
    
    return filteredMembers;
  };

  const finalMembers = allMembersIncludingOwner();

  // Calculate counts
  const totalCount = members.length + (roomData?.owner && !members.some(m => m.user.id === roomData.owner.id) ? 1 : 0);
  const staffCount = finalMembers.filter(member => 
    member.role === 'moderator' || member.role === 'owner'
  ).length;

  const getRoleIcon = (member) => {
    if (member.role === 'owner' || member.user.id === roomData?.owner?.id) {
      return <TrophyIcon className="w-4 h-4 text-yellow-500" />;
    } else if (member.role === 'moderator') {
      return <ShieldCheckIcon className="w-4 h-4 text-blue-500" />;
    }
    return null;
  };

  const getRoleLabel = (member) => {
    if (member.role === 'owner' || member.user.id === roomData?.owner?.id) {
      return (
        <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 rounded-full font-medium">
          Owner
        </span>
      );
    } else if (member.role === 'moderator') {
      return (
        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full font-medium">
          Moderator
        </span>
      );
    }
    return null;
  };

  const isCurrentUser = (member) => {
    return member.user.id === user?.id;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Room Members
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalCount} member{totalCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'staff'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Staff
          </button>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading members...</p>
            </div>
          ) : finalMembers.length === 0 ? (
            <div className="p-6 text-center">
              <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No members found matching your search' : 'No members found'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {finalMembers.map((member) => (
                <div
                  key={member.user.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Avatar 
                    user={member.user}
                    size="md"
                    showBorder={true}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(member)}
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {member.user.name}
                      </p>
                      {isCurrentUser(member) && (
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      {getRoleLabel(member)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-center flex-1">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{totalCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{staffCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Staff</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomMembersModal; 