import React, { useState, useEffect } from 'react';
import { 
  Flag,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  User,
  Calendar,
  ChevronDown,
  Shield,
  Clock,
  FileText,
  ExternalLink
} from 'lucide-react';
import apiService from '../../services/apiService';
import { useToast } from '../../contexts/ToastContext';

const ContentModeration = () => {
  const { showSuccess, showError } = useToast();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [reasonFilter, setReasonFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    under_review: 0,
    resolved: 0,
    high_priority: 0
  });
  const [filters, setFilters] = useState({
    reasons: {},
    statuses: {},
    severities: {}
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchStats();
    fetchFilters();
  }, [currentPage, searchTerm, statusFilter, reasonFilter, severityFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: 15,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'All' && { status: statusFilter }),
        ...(reasonFilter !== 'All' && { reason: reasonFilter }),
        ...(severityFilter !== 'All' && { severity: severityFilter.toLowerCase() })
      };

      const response = await apiService.get('/admin/content-moderation', { params });
      
      if (response.success) {
        setReports(response.reports.data);
        setTotalPages(response.reports.last_page);
        setFilteredReports(response.reports.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.get('/admin/content-moderation/stats');
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchFilters = async () => {
    try {
      const response = await apiService.get('/admin/content-moderation/filters');
      if (response.success) {
        setFilters(response.filters);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'reviewed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'resolved': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'dismissed': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getReasonLabel = (reason) => {
    return filters.reasons[reason] || reason;
  };

  const getStatusLabel = (status) => {
    return filters.statuses[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      setIsSubmitting(true);
      const response = await apiService.put(`/admin/content-moderation/${reportId}/status`, {
        status: newStatus
      });

      if (response.success) {
        await fetchReports();
        await fetchStats();
        setShowReportModal(false);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Failed to update report status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTakeAction = async (reportId, action) => {
    try {
      setIsSubmitting(true);
      const response = await apiService.post(`/admin/content-moderation/${reportId}/action`, {
        action: action
      });

      if (response.success) {
        await fetchReports();
        await fetchStats();
        setShowActionModal(false);
        setSelectedReport(null);
        showSuccess(response.message);
      }
    } catch (error) {
      console.error('Error taking action:', error);
      showError('Failed to take action on post');
    } finally {
      setIsSubmitting(false);
    }
  };

      const ActionDropdown = ({ report }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const dropdownRef = React.useRef(null);
    const buttonRef = React.useRef(null);

    const calculatePosition = () => {
      if (!buttonRef.current) return;
      
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 224; // w-56 = 224px
      const dropdownHeight = 200;
      
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
    React.useEffect(() => {
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
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MoreVertical size={16} />
          </button>
        </div>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="fixed w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 9999,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
              <button
                onClick={() => {
                  setSelectedReport(report);
                  setShowReportModal(true);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <Eye size={16} />
                <span>View Details</span>
              </button>
              
              {report.status !== 'reviewed' && (
                <button
                  onClick={() => {
                    handleUpdateStatus(report.id, 'reviewed');
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center space-x-2"
                >
                  <Eye size={16} />
                  <span>Mark Under Review</span>
                </button>
              )}

              {report.status !== 'resolved' && (
                <button
                  onClick={() => {
                    setSelectedReport(report);
                    setActionType('resolve');
                    setShowActionModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center space-x-2"
                >
                  <CheckCircle size={16} />
                  <span>Take Action & Resolve</span>
                </button>
              )}

              {report.status !== 'dismissed' && (
                <button
                  onClick={() => {
                    handleUpdateStatus(report.id, 'dismissed');
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20 flex items-center space-x-2"
                >
                  <XCircle size={16} />
                  <span>Dismiss Report</span>
                </button>
              )}
            </div>
        )}
      </>
    );
  };

  const ReportDetailsModal = ({ report, onClose }) => {
    if (!report) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">
              {/* Report Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Reported By</label>
                    <p className="text-gray-900 dark:text-white">{report.reporter?.name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500">{report.reporter?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Post Author</label>
                    <p className="text-gray-900 dark:text-white">{report.post?.author?.name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500">{report.post?.author?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Room</label>
                    <p className="text-gray-900 dark:text-white">{report.post?.room?.name || 'Unknown Room'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Report Date</label>
                    <p className="text-gray-900 dark:text-white">{formatDate(report.created_at)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(report.status)}`}>
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Severity</label>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${getSeverityColor(report.severity)}`}>
                      {report.severity?.charAt(0).toUpperCase() + report.severity?.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Reason</label>
                    <p className="text-gray-900 dark:text-white">{getReasonLabel(report.reason)}</p>
                  </div>
                  {report.reviewed_by && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Reviewed By</label>
                      <p className="text-gray-900 dark:text-white">{report.reviewer?.name}</p>
                      <p className="text-sm text-gray-500">{formatDate(report.reviewed_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reported Post Content */}
              {report.post && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Reported Post</label>
                  <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">{report.post.title}</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{report.post.content}</p>
                    {report.post.media && report.post.media.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">{report.post.media.length} media file(s) attached</p>
                    )}
                  </div>
                </div>
              )}

              {/* Report Description */}
              {report.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Report Description</label>
                  <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-gray-900 dark:text-white">{report.description}</p>
                  </div>
                </div>
              )}

              {/* Admin Action */}
              {report.admin_action && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Admin Action Taken</label>
                  <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-gray-900 dark:text-white font-medium">
                      {report.admin_action === 'remove_post' && 'Post Removed'}
                      {report.admin_action === 'make_private' && 'Post Made Private'}
                      {report.admin_action === 'no_action' && 'No Action Taken'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Close
            </button>
            
            {report.status !== 'dismissed' && (
              <button
                onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Dismiss'}
              </button>
            )}

            {report.status !== 'reviewed' && (
              <button
                onClick={() => handleUpdateStatus(report.id, 'reviewed')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Mark Under Review'}
              </button>
            )}
            
            {report.status !== 'resolved' && report.post && (
              <button
                onClick={() => {
                  setActionType('resolve');
                  setShowActionModal(true);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                Take Action
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ActionModal = ({ report, onClose }) => {
    if (!report) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Take Action on Post</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Choose an action to take on the reported post:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleTakeAction(report.id, 'remove_post')}
                className="w-full p-4 text-left border border-red-200 hover:border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                disabled={isSubmitting}
              >
                <div className="flex items-center space-x-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-600">Remove Post</p>
                    <p className="text-sm text-gray-500">Permanently delete the post and all its content</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTakeAction(report.id, 'make_private')}
                className="w-full p-4 text-left border border-orange-200 hover:border-orange-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                disabled={isSubmitting}
              >
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-600">Make Private</p>
                    <p className="text-sm text-gray-500">Change post visibility from public to private</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTakeAction(report.id, 'no_action')}
                className="w-full p-4 text-left border border-gray-200 hover:border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-600">No Action</p>
                    <p className="text-sm text-gray-500">Resolve report without taking action on the post</p>
                  </div>
                </div>
              </button>
            </div>

          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isSubmitting}
            >
              Cancel
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Moderation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and manage reported content, users, and rooms
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              // Open user interface in a new tab while keeping admin session
              window.open('/user/dashboard', '_blank');
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            title="Explore the website as a regular user"
          >
            <ExternalLink size={16} />
            <span>View as User</span>
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Reports: {stats.total} | Showing: {reports.length}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Flag size={20} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Eye size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.under_review}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Under Review</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.resolved}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.high_priority}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports by content, user, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Status</option>
              {Object.entries(filters.statuses).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Reason Filter */}
          <div className="relative">
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Reasons</option>
              {Object.entries(filters.reasons).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Severity Filter */}
          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Severity</option>
              {Object.entries(filters.severities).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center">
            <Flag size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reports found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'All' || reasonFilter !== 'All' || severityFilter !== 'All'
                ? 'Try adjusting your filters to see more reports.'
                : 'No reports have been submitted yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Report
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <MessageSquare size={16} className="text-blue-500 mt-1" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {report.post?.title || 'Untitled Post'}
                            </p>
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                              <p>Reported by: {report.reporter?.name}</p>
                              <p>Post by: {report.post?.author?.name}</p>
                              <p>Room: {report.post?.room?.name}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          <FileText size={12} className="mr-1" />
                          Post
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {getStatusLabel(report.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                          {report.severity?.charAt(0).toUpperCase() + report.severity?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <ActionDropdown report={report} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showReportModal && selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => {
            setShowReportModal(false);
            setSelectedReport(null);
          }}
        />
      )}

      {showActionModal && selectedReport && (
        <ActionModal
          report={selectedReport}
          onClose={() => {
            setShowActionModal(false);
            setSelectedReport(null);
          }}
        />
      )}
    </div>
  );
};

export default ContentModeration; 