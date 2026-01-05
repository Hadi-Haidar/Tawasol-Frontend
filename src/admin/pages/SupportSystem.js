import React, { useState, useEffect } from 'react';
import { 
  HelpCircle,
  Search,
  Filter,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  MessageCircle,
  ChevronDown,
  Send,
  Paperclip,
  Calendar,
  Tag,
  X
} from 'lucide-react';
import adminService from '../../services/adminService';

// 🚀 CRITICAL FIX: Move TicketModal OUTSIDE the main component to prevent recreation
const TicketModal = React.memo(({ 
  ticket, 
  onClose, 
  replyMessage, 
  setReplyMessage, 
  handleSendReply, 
  loading,
  statuses,
  handleStatusUpdate,
  getPriorityColor,
  getStatusColor,
  getStatusIcon,
  replyAttachment,
  setReplyAttachment
}) => {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.ticketNumber}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.subject}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Ticket Details */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">User</label>
                <p className="text-gray-900 dark:text-white">{ticket.userName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.user}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                <div className="mt-1">
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statuses.filter(s => s !== 'All').map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                <p className="text-gray-900 dark:text-white">{ticket.category}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</label>
                <p className="text-gray-900 dark:text-white">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(ticket.createdAt).toLocaleTimeString()}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Update</label>
                <p className="text-gray-900 dark:text-white">{new Date(ticket.lastUpdate).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(ticket.lastUpdate).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col">
            {/* Messages List */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                {ticket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        message.senderType === 'admin'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium">{message.sender}</span>
                        <span className={`text-xs ${
                          message.senderType === 'admin' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                      
                      {/* Attachment Display */}
                      {message.attachment_path && (
                        <div className="mt-2">
                          {message.attachment_name && (
                            message.attachment_name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                              <div className="max-w-xs">
                                <img 
                                  src={message.attachment_url} 
                                  alt={message.attachment_name}
                                  className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(message.attachment_url, '_blank')}
                                />
                                <p className="text-xs mt-1 opacity-75">{message.attachment_name}</p>
                              </div>
                            ) : (
                              <a 
                                href={message.attachment_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-2 mt-2 px-3 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                              >
                                <Paperclip size={14} />
                                <span className="text-sm">{message.attachment_name}</span>
                              </a>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-3">
                <textarea
                  value={replyMessage}
                  onChange={(e) => {
                    setReplyMessage(e.target.value);
                    // Auto-resize textarea
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="Type your reply... (Press Enter to send, Shift+Enter for new line)"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  style={{ minHeight: '96px', maxHeight: '150px' }}
                />
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      id="reply-attachment"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      onChange={(e) => setReplyAttachment(e.target.files[0])}
                      className="hidden"
                    />
                    <label 
                      htmlFor="reply-attachment"
                      className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                    >
                      <Paperclip size={16} />
                      <span>Attach File</span>
                    </label>
                    {replyAttachment && (
                      <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                        <span>{replyAttachment.name}</span>
                        <button 
                          onClick={() => setReplyAttachment(null)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSendReply}
                    disabled={(!replyMessage.trim() && !replyAttachment) || loading}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Send size={16} />
                    <span>{loading ? 'Sending...' : 'Send Reply'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const SupportSystem = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    openTickets: 0,
    inProgressTickets: 0,
    criticalTickets: 0,
    todayTickets: 0
  });
  // Support values from API
  const statuses = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];
  const categories = ['All', 'Technical Issues', 'Subscriptions', 'Security', 'General Support', 'Billing', 'Account'];
  const priorities = ['All', 'Low', 'Medium', 'High'];
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  });

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch filtered data when filters change
  useEffect(() => {
    fetchFilteredTickets();
  }, [searchTerm, statusFilter, categoryFilter, priorityFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all initial data in parallel
      const [statsResponse, prioritiesResponse] = await Promise.all([
        adminService.getSupportStats(),
        adminService.getSupportPriorities()
      ]);

      if (statsResponse.success) {
        setStats({
          openTickets: statsResponse.data.open_tickets,
          inProgressTickets: statsResponse.data.in_progress_tickets,
          criticalTickets: statsResponse.data.high_priority_tickets,
          todayTickets: statsResponse.data.today_tickets
        });
      }

      // Fetch initial tickets
      await fetchFilteredTickets();
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredTickets = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: pagination.per_page,
        search: searchTerm || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        priority: priorityFilter !== 'All' ? priorityFilter : undefined,
      };

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await adminService.getSupportTickets(params);
      
      if (response.success) {
        setTickets(response.data.tickets);
        setFilteredTickets(response.data.tickets);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      setTickets([]);
      setFilteredTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'In Progress': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Resolved': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'Closed': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'High': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'Critical': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open': return <MessageCircle size={16} className="text-blue-500" />;
      case 'In Progress': return <Clock size={16} className="text-yellow-500" />;
      case 'Resolved': return <CheckCircle size={16} className="text-green-500" />;
      case 'Closed': return <XCircle size={16} className="text-gray-500" />;
      default: return <HelpCircle size={16} className="text-gray-500" />;
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      const response = await adminService.updateTicketStatus(ticketId, newStatus);
      if (response.success) {
        // Update the ticket in local state
        setTickets(prev => prev.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, status: newStatus, lastUpdate: new Date().toISOString() }
            : ticket
        ));
        
        // Update selected ticket if it's open
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(prev => ({
            ...prev,
            status: newStatus,
            lastUpdate: new Date().toISOString()
          }));
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleViewTicket = async (ticketId) => {
    try {
      const response = await adminService.getSupportTicket(ticketId);
      if (response.success) {
        setSelectedTicket(response.data);
        setShowTicketModal(true);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  const handleSendReply = async () => {
    if ((!replyMessage.trim() && !replyAttachment) || !selectedTicket) return;

    setLoading(true);
    try {
      const formData = new FormData();
      if (replyMessage.trim()) {
        formData.append('message', replyMessage);
      }
      if (replyAttachment) {
        formData.append('attachment', replyAttachment);
      }

      const response = await adminService.sendSupportReply(selectedTicket.id, formData);
      
      if (response.success) {
        setReplyMessage('');
        setReplyAttachment(null);
        // Clear file input
        const fileInput = document.getElementById('reply-attachment');
        if (fileInput) fileInput.value = '';
        // Refresh ticket details
        await handleViewTicket(selectedTicket.id);
        // Refresh tickets list
        await fetchFilteredTickets();
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support System</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage user support tickets and help requests
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.openTickets}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <MessageCircle size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.inProgressTickets}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock size={24} className="text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Priority</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.criticalTickets}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Tickets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.todayTickets}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Calendar size={24} className="text-green-600 dark:text-green-400" />
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
                placeholder="Search tickets by ticket number or user..."
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
              {statuses.map(status => (
                <option key={status} value={status}>{status === 'All' ? 'All Status' : status}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category === 'All' ? 'All Categories' : category}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {priorities.map(priority => (
                <option key={priority} value={priority}>{priority === 'All' ? 'All Priority' : priority}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticket</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{ticket.ticketNumber}</div>
                      <div className="text-sm text-gray-900 dark:text-white font-medium">{ticket.subject}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{ticket.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{ticket.userName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{ticket.user}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      <Tag size={12} className="mr-1" />
                      {ticket.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(ticket.status)}
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>{new Date(ticket.createdAt).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(ticket.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewTicket(ticket.id)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Loading support tickets...</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch the latest data.</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No support tickets found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
          </div>
        ) : null}
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchFilteredTickets(pagination.current_page - 1)}
                disabled={pagination.current_page === 1 || loading}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => fetchFilteredTickets(page)}
                      disabled={loading}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        pagination.current_page === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => fetchFilteredTickets(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page || loading}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {showTicketModal && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => {
            setShowTicketModal(false);
            setSelectedTicket(null);
            setReplyMessage('');
            setReplyAttachment(null);
          }}
          replyMessage={replyMessage}
          setReplyMessage={setReplyMessage}
          handleSendReply={handleSendReply}
          loading={loading}
          statuses={statuses}
          handleStatusUpdate={handleStatusUpdate}
          getPriorityColor={getPriorityColor}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          replyAttachment={replyAttachment}
          setReplyAttachment={setReplyAttachment}
        />
      )}
    </div>
  );
};

export default SupportSystem; 