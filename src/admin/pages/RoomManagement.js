import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Eye, Users, MessageSquare, Edit, Trash2, Shield, Lock, Globe, AlertTriangle, Info, ChevronDown, X, Check } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import adminService from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';

const RoomManagement = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1
  });
  const [summary, setSummary] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const roomTypes = ['All Types', 'Public', 'Private', 'Secure'];
  const categories = ['All Categories', 'Commercial'];

  useEffect(() => {
    fetchRooms();
  }, [searchTerm, selectedType, selectedCategory, pagination.current_page]);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: pagination.current_page,
        per_page: pagination.per_page,
        search: searchTerm,
        type: selectedType === 'All Types' ? 'all' : selectedType.toLowerCase(),
        category: selectedCategory === 'All Categories' ? 'all_categories' : selectedCategory.toLowerCase()
      };const response = await adminService.getRooms(params);if (response.success) {
        setRooms(response.data.data);
        setFilteredRooms(response.data.data);
        setPagination({
          current_page: response.data.current_page,
          per_page: response.data.per_page,
          total: response.data.total,
          last_page: response.data.last_page
        });
        setSummary(response.summary);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleTypeFilter = (type) => {
    setSelectedType(type);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current_page: page }));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'private':
        return <Lock className="w-4 h-4" />;
      case 'secure':
        return <Shield className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'public':
        return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-700';
      case 'private':
        return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-700';
      case 'secure':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-700';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-600';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleSelectRoom = (roomId) => {
    setSelectedRooms(prev => {
      const newSelected = prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId];
      setShowBulkActions(newSelected.length > 0);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectedRooms.length === filteredRooms.length) {
      setSelectedRooms([]);
      setShowBulkActions(false);
    } else {
      const allIds = filteredRooms.map(room => room.id);
      setSelectedRooms(allIds);
      setShowBulkActions(true);
    }
  };

  const handleViewDetails = async (roomId) => {
    setActionLoading(true);
    try {const response = await adminService.getRoom(roomId);if (response.success) {
        setSelectedRoom(response.data.room);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoom = (room) => {
    setSelectedRoom(room);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedRoom) return;
    
    setActionLoading(true);
    try {
      const response = await adminService.deleteRoom(selectedRoom.id, deleteReason);
      if (response.success) {
        setShowDeleteModal(false);
        setDeleteReason('');
        setSelectedRoom(null);
        fetchRooms(); // Refresh the list
        showSuccess('Room deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedRooms.length === 0) return;
    
    setActionLoading(true);
    try {
      const response = await adminService.bulkRoomAction(action, selectedRooms, 'Bulk admin action');
      if (response.success) {
        setSelectedRooms([]);
        setShowBulkActions(false);
        fetchRooms(); // Refresh the list
        showSuccess(`Bulk ${action} completed successfully`);
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.current_page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.last_page, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            i === pagination.current_page
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
          {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
          {pagination.total} results
        </div>
        <div className="flex items-center space-x-2">
            <button
            onClick={() => handlePageChange(pagination.current_page - 1)}
            disabled={pagination.current_page <= 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
            Previous
            </button>
          {pages}
            <button
            onClick={() => handlePageChange(pagination.current_page + 1)}
            disabled={pagination.current_page >= pagination.last_page}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
            Next
            </button>
        </div>
      </div>
    );
  };

  // Simple dropdown toggle
  const toggleDropdown = (roomId) => {
    setActiveDropdown(activeDropdown === roomId ? null : roomId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
          </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/30 dark:border-red-700">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-300">Error: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Room Management</h1>
        <p className="text-gray-600 dark:text-gray-400">View and manage all rooms on the platform</p>
        {summary && (
          <div className="mt-4 text-right text-sm text-gray-600 dark:text-gray-400">
            Total Rooms: {summary.total_rooms} | Showing: {summary.showing}
        </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
              placeholder="Search rooms by name..."
                value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
            value={selectedType}
            onChange={(e) => handleTypeFilter(e.target.value)}
            className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {roomTypes.map(type => (
              <option key={type} value={type}>{type}</option>
              ))}
            </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
            value={selectedCategory}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
              <option key={category} value={category}>{category}</option>
              ))}
            </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/30 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 dark:text-blue-300">
              {selectedRooms.length} room{selectedRooms.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={actionLoading}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rooms Table */}
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRooms.length === filteredRooms.length && filteredRooms.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(room.id)}
                      onChange={() => handleSelectRoom(room.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{room.name}</div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs truncate">
                        {room.description || 'No description'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(room.type)}`}>
                        {getTypeIcon(room.type)}
                        <span className="ml-1 capitalize">{room.type}</span>
                      </span>
                      {room.is_commercial && (
                        <div>
                          <button
                            onClick={() => {
                              showInfo(`Commercial room: ${room.name} - This room has commercial features enabled.`);
                            }}
                            className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors cursor-pointer border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-900/50"
                            title="Click for commercial room info"
                          >
                            <span className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full mr-2"></span>
                            Commercial
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{room.owner}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {room.members}
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {room.posts}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(room.created_at)}
                  </td>
                                     <td className="px-6 py-4">
                     <div className="relative dropdown-container">
                       <button
                         onClick={() => toggleDropdown(room.id)}
                         className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                       >
                         <MoreVertical className="w-5 h-5" />
                       </button>
                       
                                                {activeDropdown === room.id && (
                           <div 
                             className="absolute w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50"
                             style={{ 
                               right: '120px', // Position it to the left to cover the "CREATED" column
                               bottom: '20px', // Move it down a bit from the button
                               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                               zIndex: 1000
                             }}
                           >
                             <div className="py-1">
                               <button
                                 onClick={() => {
                                   handleViewDetails(room.id);
                                   setActiveDropdown(null);
                                 }}
                                 className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 w-full text-left transition-colors"
                               >
                                 <Eye className="w-4 h-4 mr-3 text-blue-500 dark:text-blue-400" />
                                 View Details
                               </button>
                               <button
                                 onClick={() => {
                                   handleDeleteRoom(room);
                                   setActiveDropdown(null);
                                 }}
                                 className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 w-full text-left transition-colors"
                               >
                                 <Trash2 className="w-4 h-4 mr-3 text-red-500 dark:text-red-400" />
                                 Delete Room
                               </button>
                             </div>
                           </div>
                         )}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > pagination.per_page && renderPagination()}
      </div>

      {/* Room Details Modal */}
      {showDetailsModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-10000" style={{ zIndex: 10000 }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Room Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room Name</label>
                  <p className="text-gray-900 dark:text-white">{selectedRoom.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <p className="text-gray-900 dark:text-white">{selectedRoom.description || 'No description'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(selectedRoom.type)}`}>
                      {getTypeIcon(selectedRoom.type)}
                      <span className="ml-1 capitalize">{selectedRoom.type}</span>
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <p className="text-gray-900 dark:text-white">{selectedRoom.is_commercial ? 'Commercial' : 'General'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner</label>
                  <p className="text-gray-900 dark:text-white">{selectedRoom.owner?.name}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedRoom.owner?.email}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Members</label>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedRoom.members_count}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Posts</label>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedRoom.posts_count}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Products</label>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedRoom.products_count || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created</label>
                    <p className="text-gray-900 dark:text-white">{formatDate(selectedRoom.created_at)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Updated</label>
                    <p className="text-gray-900 dark:text-white">{formatDate(selectedRoom.updated_at)}</p>
                  </div>
                </div>

                {selectedRoom.recent_members && selectedRoom.recent_members.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Members</label>
                    <div className="space-y-2">
                      {selectedRoom.recent_members.slice(0, 5).map((member) => {
                        // Check if this member is the owner
                        const isOwner = selectedRoom.owner && member.id === selectedRoom.owner.id;
                        const displayRole = isOwner ? 'Owner' : member.role;
                        
                        return (
                          <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium capitalize ${isOwner ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                {displayRole}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(member.joined_at)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
          </div>
        )}
      </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-10000" style={{ zIndex: 10000 }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Room</h3>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete the room "{selectedRoom.name}"? This action cannot be undone.
                All posts, members, and associated data will be permanently removed.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Enter reason for deletion..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteReason('');
                    setSelectedRoom(null);
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center dark:bg-red-500 dark:hover:bg-red-600"
                >
                  {actionLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Room
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoomManagement; 