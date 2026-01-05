import React, { useState, useEffect } from 'react';
import { 
  CreditCard,
  Search,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  Award,
  Edit3
} from 'lucide-react';
import adminService from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';

const PaymentSubscriptions = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [activeQrCode, setActiveQrCode] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    newSubscribers: 0
  });
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, paymentId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // QR Code Management States
  const [qrModal, setQrModal] = useState({ open: false, type: 'create', qrCode: null });
  const [qrForm, setQrForm] = useState({
    wish_number: '',
    description: '',
    qr_image: null
  });
  const [qrPreview, setQrPreview] = useState(null);

  const paymentStatuses = ['All', 'Completed', 'Pending', 'Rejected', 'Cancelled'];
  const subscriptionStatuses = ['All', 'Active', 'Expired', 'Cancelled'];
  const plans = ['All', 'Bronze', 'Silver', 'Gold'];

  // Fetch data functions
  const fetchStatistics = async () => {
    try {
      setStatisticsLoading(true);const response = await adminService.getPaymentStatistics();if (response.success) {
        setStatistics({
          totalRevenue: response.statistics.total_revenue || 0,
          monthlyRevenue: response.statistics.monthly_revenue || 0,
          activeSubscriptions: response.statistics.active_subscriptions || 0,
          newSubscribers: response.statistics.new_subscribers || 0
        });
      } else {
        setError('Failed to load statistics');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError(error.message || 'Failed to load statistics');
    } finally {
      setStatisticsLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter.toLowerCase();
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;const response = await adminService.getPayments(params);if (response.success) {
        setPayments(response.payments || []);
      } else {
        setError('Failed to load payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(error.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter.toLowerCase();
      if (planFilter !== 'All') params.plan = planFilter.toLowerCase();
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;const response = await adminService.getSubscriptions(params);if (response.success) {
        setSubscriptions(response.subscriptions || []);
      } else {
        setError('Failed to load subscriptions');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setError(error.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      setError(null);const response = await adminService.getPendingPayments();if (response.success) {
        setPendingPayments(response.pending_payments || []);
      } else {
        setError('Failed to load pending payments');
      }
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      setError(error.message || 'Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      setActionLoading(paymentId);
      const response = await adminService.approvePayment(paymentId);
      
      if (response.success) {
        setSuccessMessage('Payment approved successfully! Balance has been added to user account.');
        fetchPendingPayments(); // Refresh pending payments
        fetchStatistics(); // Refresh statistics
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError('Failed to approve payment');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      setError(error.message || 'Failed to approve payment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(rejectModal.paymentId);
      const response = await adminService.rejectPayment(rejectModal.paymentId, rejectReason);
      
      if (response.success) {
        setSuccessMessage('Payment rejected successfully.');
        setRejectModal({ open: false, paymentId: null });
        setRejectReason('');
        fetchPendingPayments(); // Refresh pending payments
        fetchStatistics(); // Refresh statistics
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError('Failed to reject payment');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      setError(error.message || 'Failed to reject payment');
    } finally {
      setActionLoading(null);
    }
  };

  // QR Code Management Functions
  const fetchQrCodes = async () => {
    try {
      setLoading(true);
      setError(null);const response = await adminService.getQrCodes();if (response.success) {
        setQrCodes(response.data || []);
      } else {
        setError('Failed to load QR codes');
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      setError(error.message || 'Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveQrCode = async () => {
    try {const response = await adminService.getActiveQrCode();if (response.success) {
        setActiveQrCode(response.data);
      } else {
        setActiveQrCode(null);
      }
    } catch (error) {
      console.error('Error fetching active QR code:', error);
      setActiveQrCode(null);
    }
  };

  const handleQrSubmit = async () => {
    try {
      setActionLoading('qr-submit');
      
      // Clear any previous errors
      setError(null);// Validate frontend data before sending
      if (!qrForm.wish_number || qrForm.wish_number.trim() === '') {
        setError('Please enter a wish number');
        setActionLoading(null);
        return;
      }
      
      const formData = new FormData();
      formData.append('wish_number', qrForm.wish_number.trim());
      formData.append('description', qrForm.description || '');
      if (qrForm.qr_image) {
        formData.append('qr_image', qrForm.qr_image);
      }

      // Debug FormData contentsfor (let [key, value] of formData.entries()) {}

      const response = await adminService.updateQrCode(qrModal.qrCode.id, formData);
      
      if (response.success) {
        setSuccessMessage('QR code updated successfully!');
        setQrModal({ open: false, type: 'view', qrCode: null });
        setQrForm({ wish_number: '', description: '', qr_image: null });
        setQrPreview(null);
        fetchQrCodes();
        fetchActiveQrCode();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError('Failed to update QR code');
      }
    } catch (error) {
      console.error('Error updating QR code:', error);
      setError(error.message || 'Failed to update QR code');
    } finally {
      setActionLoading(null);
    }
  };

  const handleQrImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrForm({ ...qrForm, qr_image: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setQrPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const openQrModal = (type, qrCode = null) => {
    setQrModal({ open: true, type, qrCode });
    if (qrCode && type === 'edit') {
      setQrForm({
        wish_number: qrCode.wish_number || '',
        description: qrCode.description || '',
        qr_image: null
      });
      setQrPreview(qrCode.qr_image_url || null);
    } else {
      setQrForm({ wish_number: '', description: '', qr_image: null });
      setQrPreview(null);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchStatistics();
    // Always load all data for tab counts on mount
    fetchPendingPayments();
    fetchPayments();
    fetchSubscriptions();
    fetchQrCodes();
    fetchActiveQrCode();
  }, []); // Only run on mount

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data when tab changes or filters change
  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingPayments();
    } else if (activeTab === 'payments') {
      fetchPayments();
    } else if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    } else if (activeTab === 'qr') {
      fetchQrCodes();
      fetchActiveQrCode();
    }
  }, [activeTab, statusFilter, planFilter, debouncedSearchTerm]);

  const filteredPayments = payments;
  const filteredSubscriptions = subscriptions;

  const getStatusColor = (status, type = 'payment') => {
    if (type === 'payment') {
      switch (status) {
        case 'Completed': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
        case 'Pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'Rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
        case 'Cancelled': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
        default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
      }
    } else {
      switch (status) {
        case 'Active': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
        case 'Expired': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
        case 'Cancelled': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
        default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
      }
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'Gold': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Silver': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
      case 'Bronze': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status, type = 'payment') => {
    if (type === 'payment') {
      switch (status) {
        case 'Completed': return <CheckCircle size={16} className="text-green-500" />;
        case 'Pending': return <Clock size={16} className="text-yellow-500" />;
        case 'Rejected': return <XCircle size={16} className="text-red-500" />;
        case 'Cancelled': return <XCircle size={16} className="text-gray-500" />;
        default: return <Clock size={16} className="text-gray-500" />;
      }
    } else {
      switch (status) {
        case 'Active': return <CheckCircle size={16} className="text-green-500" />;
        case 'Expired': return <XCircle size={16} className="text-red-500" />;
        case 'Cancelled': return <XCircle size={16} className="text-gray-500" />;
        default: return <Clock size={16} className="text-gray-500" />;
      }
    }
  };

  // Using statistics from API instead of calculating locally

  // Export functionality
  const exportData = () => {
    try {
      let csvContent = '';
      let filename = '';
      const currentDate = new Date().toISOString().split('T')[0];

      switch (activeTab) {
        case 'pending':
          if (pendingPayments.length === 0) {
            showWarning('No pending payments to export');
            return;
          }
          filename = `pending-payments-${currentDate}.csv`;
          csvContent = 'User Name,Email,Transaction ID,Amount,Currency,Phone,Current Balance,Date\n';
          pendingPayments.forEach(payment => {
            csvContent += `"${payment.user.name}","${payment.user.email}","${payment.transaction_id}",${payment.amount},"${payment.currency}","${payment.phone_no}",${payment.user.current_balance},"${new Date(payment.created_at).toLocaleDateString()}"\n`;
          });
          break;

        case 'payments':
          if (payments.length === 0) {
            showWarning('No payments to export');
            return;
          }
          filename = `all-payments-${currentDate}.csv`;
          csvContent = 'User Name,Email,Transaction ID,Amount,Status,Payment Method,Phone,Date\n';
          payments.forEach(payment => {
            csvContent += `"${payment.userName}","${payment.email}","${payment.transactionId}",${payment.amount.toFixed(2)},"${payment.status}","${payment.paymentMethod}","${payment.phoneNo}","${new Date(payment.date).toLocaleDateString()}"\n`;
          });
          break;

        case 'subscriptions':
          if (subscriptions.length === 0) {
            showWarning('No subscriptions to export');
            return;
          }
          filename = `subscriptions-${currentDate}.csv`;
          csvContent = 'User Name,Email,Plan,Status,Start Date,End Date,Auto Renew,Total Paid\n';
          subscriptions.forEach(subscription => {
            csvContent += `"${subscription.userName}","${subscription.email}","${subscription.plan}","${subscription.status}","${new Date(subscription.startDate).toLocaleDateString()}","${new Date(subscription.endDate).toLocaleDateString()}","${subscription.autoRenew ? 'Yes' : 'No'}",${subscription.totalPaid.toFixed(2)}\n`;
          });
          break;

        case 'qr':
          showInfo('Export not available for QR Management');
          return;

        default:
          showError('Invalid tab for export');
          return;
      }

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message and toast
      const tabDisplayName = {
        'pending': 'Pending Payments',
        'payments': 'All Payments', 
        'subscriptions': 'Subscriptions'
      }[activeTab];
      
      setSuccessMessage(`${filename} exported successfully!`);
      showSuccess(`${tabDisplayName} report exported successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export data. Please try again.');
      setError('Failed to export data. Please try again.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments & Subscriptions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor payments and manage subscription plans
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => {
              fetchStatistics();
              if (activeTab === 'pending') {
                fetchPendingPayments();
              } else if (activeTab === 'payments') {
                fetchPayments();
              } else if (activeTab === 'subscriptions') {
                fetchSubscriptions();
              } else if (activeTab === 'qr') {
                fetchQrCodes();
                fetchActiveQrCode();
              }
            }}
            className="btn-secondary flex items-center space-x-2"
            disabled={loading}
          >
            <Calendar size={16} />
            <span>Refresh</span>
          </button>
        <button 
          onClick={exportData}
          className={`flex items-center space-x-2 ${
            activeTab === 'qr' 
              ? 'btn-secondary opacity-50 cursor-not-allowed' 
              : 'btn-primary'
          }`}
          disabled={loading || activeTab === 'qr'}
          title={activeTab === 'qr' ? 'Export not available for QR Management' : 'Export current data as CSV'}
        >
          <Download size={16} />
          <span>Export Report</span>
        </button>
      </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          <p>{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setSuccessMessage('');
              fetchStatistics();
              if (activeTab === 'pending') {
                fetchPendingPayments();
              } else if (activeTab === 'payments') {
                fetchPayments();
              } else if (activeTab === 'subscriptions') {
                fetchSubscriptions();
              } else if (activeTab === 'qr') {
                fetchQrCodes();
                fetchActiveQrCode();
              }
            }}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {statisticsLoading ? (
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-600 h-8 w-20 rounded"></div>
                ) : (
                  `$${statistics.totalRevenue.toFixed(2)}`
                )}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <DollarSign size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {statisticsLoading ? (
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-600 h-8 w-20 rounded"></div>
                ) : (
                  `$${statistics.monthlyRevenue.toFixed(2)}`
                )}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {statisticsLoading ? (
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-600 h-8 w-16 rounded"></div>
                ) : (
                  statistics.activeSubscriptions
                )}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Users size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Subscribers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {statisticsLoading ? (
                  <div className="animate-pulse bg-gray-200 dark:bg-gray-600 h-8 w-16 rounded"></div>
                ) : (
                  statistics.newSubscribers
                )}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Award size={24} className="text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Pending Payments ({pendingPayments.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              All Payments ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subscriptions'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Subscriptions ({subscriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'qr'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              QR Management ({qrCodes.length})
            </button>
          </nav>
        </div>

        {/* Filters - Only show for payments and subscriptions, not for pending or qr */}
        {activeTab !== 'pending' && activeTab !== 'qr' && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
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
                {(activeTab === 'payments' ? paymentStatuses : subscriptionStatuses).map(status => (
                  <option key={status} value={status}>{status === 'All' ? 'All Status' : status}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

              {/* Plan Filter - Only show for subscriptions */}
              {activeTab === 'subscriptions' && (
            <div className="relative">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {plans.map(plan => (
                  <option key={plan} value={plan}>{plan === 'All' ? 'All Plans' : plan}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          ) : activeTab === 'pending' ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pendingPayments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                        <CreditCard size={32} className="text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No pending payments found
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No payments are waiting for approval.
                      </p>
                    </td>
                  </tr>
                ) : pendingPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{payment.user.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{payment.user.email}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{payment.transaction_id}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          Current Balance: ${payment.user.current_balance}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">${payment.amount} {payment.currency}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Balance Top-up</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {payment.phone_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprovePayment(payment.id)}
                          disabled={actionLoading === payment.id}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs"
                        >
                          {actionLoading === payment.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, paymentId: payment.id })}
                          disabled={actionLoading === payment.id}
                          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'payments' ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{payment.userName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{payment.email}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{payment.transactionId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">${payment.amount.toFixed(2)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Balance Top-up</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(payment.status, 'payment')}
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status, 'payment')}`}>
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {payment.phoneNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'qr' ? (
            // QR Management Content
            <div className="p-6 space-y-8">
              {/* Active QR Code Display */}
              {activeQrCode && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                        <CreditCard className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-1">
                          🎯 Currently Active QR Code
                        </h3>
                        <p className="text-green-600 dark:text-green-400 font-medium">
                          Wish Number: {activeQrCode.wish_number}
                        </p>
                        <p className="text-green-500 dark:text-green-400 text-sm">
                          {activeQrCode.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => openQrModal('view', activeQrCode)}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              )}

              {/* QR Codes Management Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    QR Code Management
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Update payment QR codes for your system
                  </p>
                </div>
              </div>

              {/* QR Codes Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {qrCodes.map((qr) => (
                  <div key={qr.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    {/* Card Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${qr.id === activeQrCode?.id ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <CreditCard className={`h-6 w-6 ${qr.id === activeQrCode?.id ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {qr.wish_number}
                            </h4>
                            {qr.id === activeQrCode?.id && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 mt-1">
                                ✓ Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</p>
                        <p className="text-gray-900 dark:text-white">
                          {qr.description || 'No description provided'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-500 dark:text-gray-400 mb-1">Created</p>
                          <p className="text-gray-900 dark:text-white">
                            {new Date(qr.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500 dark:text-gray-400 mb-1">Updated</p>
                          <p className="text-gray-900 dark:text-white">
                            {new Date(qr.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Actions
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openQrModal('view', qr)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          
                          <button
                            onClick={() => openQrModal('edit', qr)}
                            className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Auto Renew</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{subscription.userName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{subscription.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(subscription.plan)}`}>
                        <Award size={12} className="mr-1" />
                        {subscription.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(subscription.status, 'subscription')}
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status, 'subscription')}`}>
                          {subscription.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div>{new Date(subscription.startDate).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        to {new Date(subscription.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        subscription.autoRenew 
                          ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
                          : 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {subscription.autoRenew ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      ${subscription.totalPaid.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && ((activeTab === 'pending' && pendingPayments.length === 0) ||
          (activeTab === 'qr' && qrCodes.length === 0)) && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <CreditCard size={32} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No {activeTab === 'pending' ? 'pending payments' : 'QR codes'} found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {error ? 'Failed to load data.' : 
                activeTab === 'pending' ? 'No payments are waiting for approval.' :
                'No QR codes available for management.'}
            </p>
          </div>
        )}
      </div>

      {/* Reject Payment Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Reject Payment
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please provide a reason for rejecting this payment request.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setRejectModal({ open: false, paymentId: null });
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPayment}
                disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {qrModal.type === 'edit' ? 'Edit QR Code' : 'QR Code Details'}
              </h3>
              <button
                onClick={() => setQrModal({ open: false, type: 'view', qrCode: null })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            {qrModal.type === 'view' ? (
              <div className="p-6 space-y-4">
                {/* QR Code Image */}
                {qrModal.qrCode?.qr_image_url && (
                  <div className="flex justify-center">
                    <img
                      src={qrModal.qrCode.qr_image_url}
                      alt="QR Code"
                      className="max-w-48 max-h-48 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Wish Number
                    </label>
                    <p className="text-gray-900 dark:text-white">{qrModal.qrCode?.wish_number}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <p className="text-gray-900 dark:text-white">{qrModal.qrCode?.description || 'No description'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Created At
                    </label>
                    <p className="text-gray-900 dark:text-white">{new Date(qrModal.qrCode?.created_at).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Updated
                    </label>
                    <p className="text-gray-900 dark:text-white">{new Date(qrModal.qrCode?.updated_at).toLocaleDateString()}</p>
                  </div>

                  {qrModal.qrCode?.id === activeQrCode?.id && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                        🎯 This is the currently active QR code
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setQrModal({ open: false, type: 'view', qrCode: null })}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => openQrModal('edit', qrModal.qrCode)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Edit3 size={16} />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleQrSubmit(); }} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Wish Number *
                  </label>
                  <input
                    type="text"
                    value={qrForm.wish_number}
                    onChange={(e) => setQrForm({ ...qrForm, wish_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter wish number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={qrForm.description}
                    onChange={(e) => setQrForm({ ...qrForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter description (optional)"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    QR Code Image (optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrImageChange}
                      className="hidden"
                      id="qr-upload"
                    />
                    <label
                      htmlFor="qr-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Download className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Click to upload new QR code image
                      </span>
                    </label>
                    
                    {qrPreview && (
                      <div className="mt-4 flex justify-center">
                        <img
                          src={qrPreview}
                          alt="QR Preview"
                          className="max-w-32 max-h-32 object-contain rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                  {qrModal.type === 'edit' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Leave empty to keep current image
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setQrModal({ open: false, type: 'view', qrCode: null });
                      setQrForm({ wish_number: '', description: '', qr_image: null });
                      setQrPreview(null);
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'qr-submit'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {actionLoading === 'qr-submit' && <Calendar className="animate-spin h-4 w-4" />}
                    <span>{actionLoading === 'qr-submit' ? 'Updating...' : 'Update QR Code'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSubscriptions; 