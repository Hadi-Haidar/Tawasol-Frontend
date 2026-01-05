import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RoomCard from '../components/rooms/RoomCard';
import CreateRoomModal from '../components/rooms/CreateRoomModal';
import RoomJoinModal from '../components/rooms/RoomJoinModal';
import apiService from '../services/apiService';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const RoomsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRooms();
  }, [currentPage, filterType, searchTerm]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = {
        page: currentPage,
        ...(searchTerm && { search: searchTerm }),
        // Only add type filter for actual room types
        ...(filterType !== 'all' && filterType !== 'my_rooms' && filterType !== 'owned' && { type: filterType }),
        ...(filterType === 'my_rooms' && { my_rooms: true }),
        ...(filterType === 'owned' && { owned: true }),
      };

      // Fetch rooms from database
      const response = await apiService.get('/rooms', { params });
      
      // Handle the response structure - adjust based on your API response format
      if (response.data) {
        setRooms(response.data.rooms?.data || response.data.data || response.data);
        setTotalPages(response.data.rooms?.last_page || response.data.last_page || 1);
      } else {
        setRooms(response.rooms?.data || response.data || response);
        setTotalPages(response.rooms?.last_page || response.last_page || 1);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      
      // If there's an error, show empty state
      setRooms([]);
      setTotalPages(1);
      setLoading(false);
      
      // Show user-friendly error message
      if (error.response?.status === 404) {
        console.log('Rooms not found');
      } else if (error.response?.status >= 500) {
        alert('Server error. Please try again later.');
      } else if (error.response?.status === 401) {
        // This will be handled by the axios interceptor
        console.log('Unauthorized access');
      } else {
        console.error('Unknown error:', error);
      }
    }
  };

  const handleRoomClick = (room) => {
    // Check if user is a member
    const isMember = room.membership?.is_member || false;
    
    if (isMember) {
      // User is already a member - navigate directly to room
      navigate(`/user/rooms/${room.id}`);
    } else {
      // User is not a member - show join modal
      setSelectedRoom(room);
      setShowJoinModal(true);
    }
  };

  const handleJoinSuccess = (message) => {
    // Show success notification
    setNotification({
      type: 'success',
      message: message || 'Successfully joined room!'
    });
    
    // Hide notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
    
    // Refresh rooms list to update membership status
    fetchRooms();
    
    // Navigate to the room if it was a successful join (not pending approval)
    if (selectedRoom && (selectedRoom.type === 'public' || selectedRoom.type === 'secure')) {
      setTimeout(() => {
        navigate(`/user/rooms/${selectedRoom.id}`);
      }, 1000); // Small delay to show the success message
    }
  };

  const handleCloseJoinModal = () => {
    setShowJoinModal(false);
    setSelectedRoom(null);
  };

  const handleCreateRoom = () => {
    setShowCreateModal(true);
  };

  const handleRoomCreated = (newRoom, metadata) => {
    setRooms(prev => [newRoom, ...prev]);
    setShowCreateModal(false);
    
    // Show success notification with coin info if applicable
    const message = metadata?.cost_info?.was_free 
      ? 'Room created successfully (free)!'
      : `Room created successfully! ${metadata?.cost_info?.coins_spent || 0} coins spent.`;
    
    setNotification({
      type: 'success',
      message: message
    });
    
    // Navigate to the newly created room
            navigate(`/user/rooms/${newRoom.id}`);
  };

  const filterOptions = [
    { value: 'all', label: 'All Rooms' },
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
    { value: 'secure', label: 'Secure' },
    { value: 'my_rooms', label: 'My Rooms' },
    { value: 'owned', label: 'Owned by Me' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div className={`max-w-sm px-4 py-3 rounded-lg shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => setNotification(null)}
                className="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Rooms
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Join rooms, chat with others, and discover new communities
              </p>
            </div>
            
            <button
              onClick={handleCreateRoom}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Room
            </button>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FunnelIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <AdjustmentsHorizontalIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No rooms found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Create your first room to get started!'}
            </p>
            {(!searchTerm && filterType === 'all') && (
              <button
                onClick={handleCreateRoom}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Room
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onClick={() => handleRoomClick(room)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    const isCurrentPage = page === currentPage;
                    
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            isCurrentPage
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      (page === currentPage - 2 && page > 1) ||
                      (page === currentPage + 2 && page < totalPages)
                    ) {
                      return <span key={page} className="px-3 py-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onRoomCreated={handleRoomCreated}
        />
      )}
      {showJoinModal && (
        <RoomJoinModal
          room={selectedRoom}
          isOpen={showJoinModal}
          onClose={handleCloseJoinModal}
          onJoinSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
};

export default RoomsPage; 