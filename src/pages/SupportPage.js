import React, { useState, useEffect } from 'react';
import { 
  HelpCircle,
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  Paperclip,
  X,
 
  FileText,

} from 'lucide-react';
import apiService from '../services/apiService';

// 🚀 CRITICAL FIX: Move CreateTicketModal OUTSIDE the main component to prevent recreation
const CreateTicketModal = React.memo(({
  showCreateModal,
  onClose,
  createForm,
  setCreateForm,
  handleCreateTicket,
  loading,
  categories,
  priorities
}) => {
  if (!showCreateModal) return null;

  const handleSubjectChange = (e) => {
    setCreateForm(prev => ({ ...prev, subject: e.target.value }));
  };

  const handleDescriptionChange = (e) => {
    setCreateForm(prev => ({ ...prev, description: e.target.value }));
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  };

  const handleCategoryChange = (e) => {
    setCreateForm(prev => ({ ...prev, category: e.target.value }));
  };

  const handlePriorityChange = (e) => {
    setCreateForm(prev => ({ ...prev, priority: e.target.value }));
  };

  const handleAttachmentChange = (e) => {
    setCreateForm(prev => ({ ...prev, attachment: e.target.files[0] }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Support Ticket</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              value={createForm.subject}
              onChange={handleSubjectChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category *
            </label>
            <select
              required
              value={createForm.category}
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              {categories.filter(cat => cat !== 'All').map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              value={createForm.priority}
              onChange={handlePriorityChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {priorities.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={createForm.description}
              onChange={handleDescriptionChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Detailed description of your issue"
              style={{ minHeight: '96px', maxHeight: '150px' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Attachment (optional)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                id="ticket-attachment"
                onChange={handleAttachmentChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              />
              <label 
                htmlFor="ticket-attachment"
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
              >
                <Paperclip size={16} />
                <span>Choose File</span>
              </label>
              {createForm.attachment && (
                <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                  <span>{createForm.attachment.name}</span>
                  <button 
                    type="button"
                    onClick={() => {
                      setCreateForm(prev => ({ ...prev, attachment: null }));
                      const fileInput = document.getElementById('ticket-attachment');
                      if (fileInput) fileInput.value = '';
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Max 10MB. Supports: PDF, DOC, DOCX, JPG, PNG, GIF</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

// 🚀 CRITICAL FIX: Move TicketModal OUTSIDE the main component to prevent recreation
const TicketModal = React.memo(({ 
  selectedTicket, 
  showTicketModal, 
  onClose, 
  newMessage, 
  setNewMessage, 
  handleSendMessage, 
  sendingMessage,
  getStatusIcon,
  getStatusColor,
  getPriorityColor,
  messageAttachment,
  setMessageAttachment
}) => {
  if (!showTicketModal || !selectedTicket) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedTicket.ticket_number}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTicket.subject}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon(selectedTicket.status)}
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                <p className="text-gray-900 dark:text-white">{selectedTicket.category}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</label>
                <p className="text-gray-900 dark:text-white">{new Date(selectedTicket.created_at).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(selectedTicket.created_at).toLocaleTimeString()}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Update</label>
                <p className="text-gray-900 dark:text-white">{new Date(selectedTicket.updated_at).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(selectedTicket.updated_at).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                {/* Only show description box if there are no messages, otherwise messages will include the initial description */}
                {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">You</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(selectedTicket.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedTicket.description}</p>
                  </div>
                )}

                {selectedTicket.messages && selectedTicket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        message.sender_type === 'admin'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium">
                          {message.sender_type === 'admin' ? 'Support Team' : 'You'}
                        </span>
                        <span className={`text-xs ${
                          message.sender_type === 'admin' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {new Date(message.created_at).toLocaleString()}
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

              {selectedTicket.status !== 'Closed' && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="space-y-3">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    {/* File Upload Section */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          id="message-attachment"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                          onChange={(e) => setMessageAttachment(e.target.files[0])}
                          className="hidden"
                        />
                        <label 
                          htmlFor="message-attachment"
                          className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                        >
                          <Paperclip size={16} />
                          <span className="text-sm">Attach File</span>
                        </label>
                        {messageAttachment && (
                          <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                            <span>{messageAttachment.name}</span>
                            <button 
                              onClick={() => setMessageAttachment(null)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={handleSendMessage}
                        disabled={(!newMessage.trim() && !messageAttachment) || sendingMessage}
                        className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                      >
                        <Send size={16} />
                        <span>{sendingMessage ? 'Sending...' : 'Send Message'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
});

const SupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    totalTickets: 0
  });
  // Support values from API
  const categories = ['All', 'Technical Issues', 'Subscriptions', 'Security', 'General Support', 'Billing', 'Account'];
  const priorities = ['Low', 'Medium', 'High'];
  const statuses = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageAttachment, setMessageAttachment] = useState(null);

  // Create ticket form
  const [createForm, setCreateForm] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'Medium',
    attachment: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, categoryFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsResponse, statsResponse] = await Promise.all([
        apiService.getUserSupportTickets(),
        apiService.getUserSupportStats()
      ]);

      if (ticketsResponse.success) {
        setTickets(ticketsResponse.data.tickets || []);
      }

      if (statsResponse.success) {
        setStats({
          openTickets: statsResponse.data.open_tickets || 0,
          inProgressTickets: statsResponse.data.in_progress_tickets || 0,
          resolvedTickets: statsResponse.data.resolved_tickets || 0,
          totalTickets: statsResponse.data.total_tickets || 0
        });
      }

    } catch (error) {
      console.error('Error fetching support data:', error);
      // Set empty data to prevent crashes
      setTickets([]);
      setStats({
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        totalTickets: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (categoryFilter !== 'All') {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    setFilteredTickets(filtered);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('subject', createForm.subject);
      formData.append('description', createForm.description);
      formData.append('category', createForm.category);
      formData.append('priority', createForm.priority);
      
      if (createForm.attachment) {
        formData.append('attachment', createForm.attachment);
      }

      const response = await apiService.createSupportTicket(formData);

      if (response.success) {
        setShowCreateModal(false);
        setCreateForm({
          subject: '',
          description: '',
          category: '',
          priority: 'Medium',
          attachment: null
        });
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (ticketId) => {
    try {
      const response = await apiService.getUserSupportTicket(ticketId);
      if (response.success) {
        setSelectedTicket(response.data);
        setShowTicketModal(true);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !messageAttachment) || !selectedTicket) return;

    setSendingMessage(true);
    try {
      const formData = new FormData();
      if (newMessage.trim()) {
        formData.append('message', newMessage);
      }
      if (messageAttachment) {
        formData.append('attachment', messageAttachment);
      }

      const response = await apiService.sendUserSupportMessage(selectedTicket.id, formData);

      if (response.success) {
        setNewMessage('');
        setMessageAttachment(null);
        // Clear file input
        const fileInput = document.getElementById('message-attachment');
        if (fileInput) fileInput.value = '';
        // Refresh ticket details
        handleViewTicket(selectedTicket.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
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
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open': return <MessageSquare size={16} className="text-blue-500" />;
      case 'In Progress': return <Clock size={16} className="text-yellow-500" />;
      case 'Resolved': return <CheckCircle size={16} className="text-green-500" />;
      case 'Closed': return <XCircle size={16} className="text-gray-500" />;
      default: return <HelpCircle size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Center</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Get help with your account and technical issues
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Create Ticket</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalTickets}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
              <FileText size={24} className="text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.openTickets}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <MessageSquare size={24} className="text-blue-600 dark:text-blue-400" />
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.resolvedTickets}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search your tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

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
          </div>

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
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticket</th>
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
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{ticket.ticket_number}</div>
                      <div className="text-sm text-gray-900 dark:text-white font-medium">{ticket.subject}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{ticket.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
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
                    <div>{new Date(ticket.created_at).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(ticket.created_at).toLocaleTimeString()}
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
            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch your tickets.</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No support tickets found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tickets.length === 0 ? "You haven't created any support tickets yet." : "Try adjusting your search or filter criteria."}
            </p>
            {tickets.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create Your First Ticket
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Modals */}
      <CreateTicketModal
        showCreateModal={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        createForm={createForm}
        setCreateForm={setCreateForm}
        handleCreateTicket={handleCreateTicket}
        loading={loading}
        categories={categories}
        priorities={priorities}
      />
      <TicketModal 
        selectedTicket={selectedTicket}
        showTicketModal={showTicketModal}
        onClose={() => {
          setShowTicketModal(false);
          setSelectedTicket(null);
          setNewMessage('');
          setMessageAttachment(null);
        }}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        sendingMessage={sendingMessage}
        getStatusIcon={getStatusIcon}
        getStatusColor={getStatusColor}
        getPriorityColor={getPriorityColor}
        messageAttachment={messageAttachment}
        setMessageAttachment={setMessageAttachment}
      />
    </div>
  );
};

export default SupportPage; 