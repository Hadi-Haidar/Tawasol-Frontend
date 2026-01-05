import React, { useState, useEffect, useRef } from 'react';
import { 
  Users,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Crown,
  Star,
  Circle,
  ChevronDown,
  UserCheck,
  UserX,
  Award,
  AlertCircle,
  Loader,
  Bell
} from 'lucide-react';
import adminService from '../../services/adminService';
import SendNotificationModal from '../components/SendNotificationModal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';

const UserManagement = () => {
  const { showSuccess } = useToast();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });
  const [summary, setSummary] = useState({
    total_users: 0,
    active_users: 0,
    banned_users: 0,
    subscription_stats: { bronze: 0, silver: 0, gold: 0 }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedUserForNotification, setSelectedUserForNotification] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const subscriptionTypes = ['all', 'bronze', 'silver', 'gold'];
  const statusTypes = ['all', 'active', 'banned'];

  // Fetch users from backend
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        per_page: pagination.per_page,
        search: searchTerm || undefined,
        subscription_level: filterType !== 'all' ? filterType : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      // Remove undefined values
      Object.keys(params).forEach(key => 
        params[key] === undefined && delete params[key]
      );

      const response = await adminService.getUsers(params);
      
      if (response.success) {
        setUsers(response.data.data);
        setPagination({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total
        });
        setSummary(response.summary || summary);
    }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchUsers(1);
  }, [searchTerm, filterType, statusFilter]);

  // Handle pagination
  const handlePageChange = (page) => {
    fetchUsers(page);
  };

  const handleNotificationSent = (message) => {
    // Show success message
    showSuccess(message);
    
    // Optionally refresh users list if needed
    // fetchUsers(pagination.current_page);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [userToDelete]: true }));
      
      const response = await adminService.deleteUser(userToDelete, 'Deleted by admin for policy violation');
      
      if (response?.success) {
        // Refresh the users list
        await fetchUsers(pagination.current_page);
        showSuccess('User deleted successfully');
      }
    } catch (err) {
      console.error('Error performing user action:', err);
      setError(err.message || 'Failed to delete user');
    } finally {
      setActionLoading(prev => ({ ...prev, [userToDelete]: false }));
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const cancelDeleteUser = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const getSubscriptionColor = (subscription) => {
    switch (subscription?.toLowerCase()) {
      case 'gold': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'silver': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
      case 'bronze': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'banned': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const handleUserAction = async (action, userId) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: true }));
      
      let response;
      
            switch (action) {
              case 'ban':
          response = await adminService.updateUserStatus(userId, 'banned', 'Banned by admin');
          break;
        case 'unban':
          response = await adminService.updateUserStatus(userId, 'active', 'Unbanned by admin');
          break;
              case 'upgrade-silver':
          response = await adminService.updateUserSubscription(userId, 'silver');
          break;
              case 'upgrade-gold':
          response = await adminService.updateUserSubscription(userId, 'gold');
          break;
              case 'downgrade-bronze':
          response = await adminService.updateUserSubscription(userId, 'bronze');
          break;
              case 'delete':
          // Show confirmation modal instead of browser confirm
          setUserToDelete(userId);
          setShowDeleteConfirm(true);
          return; // Exit early, actual deletion will happen in confirmDeleteUser
          break;
              default:
          return;
            }

      if (response?.success) {
        // Refresh the users list
        await fetchUsers(pagination.current_page);
        
        // Show success message (you can add a toast notification here)
      }
    } catch (err) {
      console.error('Error performing user action:', err);
      setError(err.message || 'Failed to perform action');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const ActionDropdown = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const isActionLoading = actionLoading[user.id];
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    const calculatePosition = () => {
      if (!buttonRef.current) return;
      
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 208; // w-52 = 13rem = 208px
      const dropdownHeight = 280;
      
      // Start with default position (below and to the right)
      let top = buttonRect.bottom + 8;
      let left = buttonRect.right - dropdownWidth;
      
      // If dropdown goes below viewport, position above
      if (top + dropdownHeight > window.innerHeight - 20) {
        top = buttonRect.top - dropdownHeight - 8;
      }
      
      // If dropdown goes off left side, align to left edge
      if (left < 20) {
        left = 20;
      }
      
      setPosition({ top, left });
    };

    const handleToggleDropdown = () => {
      if (!isOpen) {
        calculatePosition();
      }
      setIsOpen(!isOpen);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    return (
      <>
      <div className="relative">
        <button
            ref={buttonRef}
            onClick={handleToggleDropdown}
            disabled={isActionLoading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
            {isActionLoading ? <Loader size={16} className="animate-spin" /> : <MoreVertical size={16} />}
        </button>
        </div>

        {isOpen && !isActionLoading && (
          <div
            ref={dropdownRef}
            className="fixed w-52 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 9999,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
              <button
              onClick={async () => {
                try {setUserDetailsLoading(true);
                  setIsOpen(false); // Close dropdown first
                  
                  const response = await adminService.getUser(user.id);if (response?.success && response?.data?.user) {
                    setSelectedUser(response.data.user);
                  setShowUserModal(true);} else {
                    console.error('Invalid response format:', response);
                    setError('Failed to fetch user details: Invalid response format');
                  }
                } catch (err) {
                  console.error('Error fetching user details:', err);
                  setError(`Failed to fetch user details: ${err.message}`);
                } finally {
                  setUserDetailsLoading(false);
                }
              }}
              disabled={userDetailsLoading}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50"
              >
              {userDetailsLoading ? (
                <Loader size={16} className="text-blue-500 animate-spin" />
              ) : (
                <Edit size={16} className="text-blue-500" />
              )}
              <span>{userDetailsLoading ? 'Loading...' : 'View Details'}</span>
              </button>

              <button
                onClick={() => {
                  setSelectedUserForNotification(user);
                  setShowNotificationModal(true);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <Bell size={16} className="text-blue-500" />
                <span>Send Notification</span>
              </button>
              
              <hr className="my-1 border-gray-200 dark:border-gray-600" />
              
              <button
                onClick={() => {
                handleUserAction(user.status.toLowerCase() === 'banned' ? 'unban' : 'ban', user.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
              {user.status.toLowerCase() === 'banned' ? (
                <>
                  <UserCheck size={16} className="text-green-500" />
                  <span>Unban User</span>
                </>
              ) : (
                <>
                  <UserX size={16} className="text-red-500" />
                  <span>Ban User</span>
                </>
              )}
              </button>

            <hr className="my-1 border-gray-200 dark:border-gray-600" />

              <button
                onClick={() => {
                  handleUserAction('upgrade-silver', user.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
              <Star size={16} className="text-gray-500" />
                <span>Upgrade to Silver</span>
              </button>

              <button
                onClick={() => {
                  handleUserAction('upgrade-gold', user.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
              <Crown size={16} className="text-yellow-500" />
                <span>Upgrade to Gold</span>
              </button>

              <button
                onClick={() => {
                  handleUserAction('downgrade-bronze', user.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
              <Circle size={16} className="text-orange-500" />
                <span>Downgrade to Bronze</span>
              </button>

            <hr className="my-1 border-gray-200 dark:border-gray-600" />

              <button
                onClick={() => {
                    handleUserAction('delete', user.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
              >
                <Trash2 size={16} />
                <span>Delete User</span>
              </button>
          </div>
        )}
      </>
    );
  };

  const UserModal = ({ user, onClose }) => {
    if (!user) return null;

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 10000 }}>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Basic Information</h4>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                <p className="text-gray-900 dark:text-white">{user.name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                <div className="flex items-center space-x-2">
                <p className="text-gray-900 dark:text-white">{user.email}</p>
                  {user.email_verified_at && (
                    <Shield size={16} className="text-green-500" title="Email verified" />
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Subscription Level</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getSubscriptionColor(user.subscription_level)}`}>
                  <Award size={12} className="mr-1" />
                  {user.subscription_level?.charAt(0).toUpperCase() + user.subscription_level?.slice(1) || 'Bronze'}
                </span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Status</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                  {user.status?.charAt(0).toUpperCase() + user.status?.slice(1) || 'Active'}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">User ID</label>
                <p className="text-gray-900 dark:text-white text-sm font-mono">{user.id}</p>
              </div>
            </div>

            {/* Activity & Stats */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Activity & Statistics</h4>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Join Date</label>
                <p className="text-gray-900 dark:text-white">{formatDate(user.created_at)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email Verified</label>
                <p className="text-gray-900 dark:text-white">
                  {user.email_verified_at ? formatDate(user.email_verified_at) : 'Not verified'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</label>
                <p className="text-gray-900 dark:text-white">{formatDate(user.updated_at)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Posts</label>
                <p className="text-gray-900 dark:text-white">{user.posts_count || 0}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rooms</label>
                <p className="text-gray-900 dark:text-white">{user.rooms_count || 0}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Coins</label>
                <p className="text-gray-900 dark:text-white">{user.coins || 0}</p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(user.google_id || user.deleted_at) && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Additional Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.google_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Google Account</label>
                    <p className="text-gray-900 dark:text-white text-sm">Connected</p>
                  </div>
                )}
                {user.deleted_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Deleted At</label>
                    <p className="text-red-600 dark:text-red-400">{formatDate(user.deleted_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage users, subscriptions, and account status
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {summary.total_users > 0 && (
            <div className="text-right">
              <div>Total Users: {summary.total_users}</div>
              <div>Active: {summary.active_users} | Banned: {summary.banned_users}</div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="text-red-600 dark:text-red-400 mr-2" size={20} />
            <span className="text-red-800 dark:text-red-200">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Subscription Filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {subscriptionTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Subscriptions' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusTypes.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subscription</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="ml-4 space-y-2">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : (
                users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                          {user.name}
                            {user.email_verified_at && (
                            <Shield size={14} className="ml-1 text-green-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getSubscriptionColor(user.subscription_level)}`}>
                      <Award size={12} className="mr-1" />
                        {user.subscription_level?.charAt(0).toUpperCase() + user.subscription_level?.slice(1) || 'Bronze'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status?.charAt(0).toUpperCase() + user.status?.slice(1) || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div>{user.posts_count || 0} posts</div>
                      <div>{user.rooms_count || 0} rooms</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <ActionDropdown user={user} />
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No users found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filterType !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No users have been registered yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} users
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                const page = i + Math.max(1, pagination.current_page - 2);
                if (page > pagination.last_page) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      page === pagination.current_page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Send Notification Modal */}
      {showNotificationModal && (
        <SendNotificationModal
          isOpen={showNotificationModal}
          user={selectedUserForNotification}
          onClose={() => {
            setShowNotificationModal(false);
            setSelectedUserForNotification(null);
          }}
          onNotificationSent={handleNotificationSent}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={cancelDeleteUser}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone and will permanently remove all user data."
        confirmText="Delete User"
        cancelText="Cancel"
        confirmStyle="danger"
        loading={userToDelete ? actionLoading[userToDelete] : false}
      />
    </div>
  );
};

export default UserManagement; 