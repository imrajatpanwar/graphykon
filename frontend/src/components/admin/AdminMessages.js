import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';
import getApiConfig from '../../config/api';
import './AdminMessages.css';

const AdminMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);
  const [moderationAction, setModerationAction] = useState('');
  const [moderationReason, setModerationReason] = useState('');

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const apiConfig = getApiConfig();
      const newSocket = io(apiConfig.socketURL, {
        withCredentials: true,
        transports: ['polling', 'websocket'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      // Socket event handlers
      newSocket.on('connect', () => {
        console.log('Admin Messages Socket.IO connected:', newSocket.id);
        newSocket.emit('join-admin-room');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Admin Messages Socket.IO connection error:', error);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Admin Messages Socket.IO disconnected:', reason);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Admin Messages Socket.IO reconnected after', attemptNumber, 'attempts');
        newSocket.emit('join-admin-room');
      });

      // Listen for real-time updates
      newSocket.on('admin-messages-moderated', (data) => {
        toast.success(`Message ${data.data.action} successfully`);
        fetchMessages();
      });

      newSocket.on('admin-messages-deleted', (data) => {
        toast.info('Message deleted');
        fetchMessages();
      });

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch messages based on active tab
  const fetchMessages = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/admin/messages';
      
      if (activeTab === 'reported') {
        endpoint = '/api/admin/messages/reported';
      } else if (activeTab === 'conversations') {
        endpoint = '/api/admin/messages/conversations';
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        status: statusFilter
      });

      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}${endpoint}?${params}`, {
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        if (activeTab === 'conversations') {
          setConversations(data.conversations);
        } else {
          setMessages(data.messages);
        }
        setTotalPages(data.totalPages);
      } else {
        toast.error(data.message || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}/api/admin/messages/stats`, {
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, [activeTab, currentPage, searchTerm, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle message selection
  const handleMessageSelect = (messageId) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedMessages.length === messages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(messages.map(msg => msg._id));
    }
  };

  // Moderate single message
  const moderateMessage = async (messageId, action, reason) => {
    try {
      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}/api/admin/messages/${messageId}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action, reason })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        fetchMessages();
        setShowModal(false);
        setModalMessage(null);
        setModerationAction('');
        setModerationReason('');
      } else {
        toast.error(data.message || 'Failed to moderate message');
      }
    } catch (error) {
      console.error('Error moderating message:', error);
      toast.error('Failed to moderate message');
    }
  };

  // Bulk moderate messages
  const bulkModerateMessages = async () => {
    if (selectedMessages.length === 0) {
      toast.warning('Please select messages to moderate');
      return;
    }

    if (!moderationAction) {
      toast.warning('Please select a moderation action');
      return;
    }

    try {
      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}/api/admin/messages/bulk-moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          messageIds: selectedMessages,
          action: moderationAction,
          reason: moderationReason
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        fetchMessages();
        setSelectedMessages([]);
        setModerationAction('');
        setModerationReason('');
      } else {
        toast.error(data.message || 'Failed to moderate messages');
      }
    } catch (error) {
      console.error('Error bulk moderating messages:', error);
      toast.error('Failed to moderate messages');
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const apiConfig = getApiConfig();
      const response = await fetch(`${apiConfig.baseURL}/api/admin/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        fetchMessages();
      } else {
        toast.error(data.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // View message details
  const viewMessageDetails = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  // Export messages
  const exportMessages = async () => {
    try {
      const apiConfig = getApiConfig();
      const params = new URLSearchParams({
        status: statusFilter,
        period: '30'
      });

      const response = await fetch(`${apiConfig.baseURL}/api/admin/messages/export?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `messages-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Messages exported successfully');
      } else {
        toast.error('Failed to export messages');
      }
    } catch (error) {
      console.error('Error exporting messages:', error);
      toast.error('Failed to export messages');
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  };

  // Render overview tab
  const renderOverview = () => (
    <div className="admin-overview">
      <div className="row">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-number">{stats.totalMessages || 0}</div>
            <div className="stat-label">Total Messages</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-number">{stats.totalConversations || 0}</div>
            <div className="stat-label">Total Conversations</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card reported">
            <div className="stat-number">{stats.reportedMessages || 0}</div>
            <div className="stat-label">Reported Messages</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-number">{stats.activeUsers || 0}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Messages by Day</h5>
            </div>
            <div className="card-body">
              {stats.messagesByDay && stats.messagesByDay.length > 0 ? (
                <div className="chart-container">
                  {stats.messagesByDay.map(day => (
                    <div key={day._id} className="chart-item">
                      <span className="chart-date">{day._id}</span>
                      <div className="chart-bar">
                        <div 
                          className="chart-fill" 
                          style={{ 
                            width: `${(day.count / Math.max(...stats.messagesByDay.map(d => d.count))) * 100}%` 
                          }}
                        ></div>
                        <span className="chart-count">{day.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No data available</p>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Message Status Overview</h5>
            </div>
            <div className="card-body">
              <div className="status-overview">
                <div className="status-item">
                  <span className="status-label">Active Messages:</span>
                  <span className="status-value">{(stats.totalMessages || 0) - (stats.deletedMessages || 0)}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Reported Messages:</span>
                  <span className="status-value reported">{stats.reportedMessages || 0}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Moderated Messages:</span>
                  <span className="status-value">{stats.moderatedMessages || 0}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Deleted Messages:</span>
                  <span className="status-value">{stats.deletedMessages || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render messages tab
  const renderMessages = () => (
    <div className="admin-messages">
      <div className="row mb-3">
        <div className="col-md-6">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="col-md-3">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Messages</option>
            <option value="reported">Reported</option>
            <option value="moderated">Moderated</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
        <div className="col-md-3">
          <button onClick={exportMessages} className="btn btn-success">
            <i className="fas fa-download"></i> Export
          </button>
        </div>
      </div>

      {selectedMessages.length > 0 && (
        <div className="bulk-actions mb-3">
          <div className="row">
            <div className="col-md-6">
              <div className="input-group">
                <select 
                  value={moderationAction} 
                  onChange={(e) => setModerationAction(e.target.value)}
                  className="form-select"
                >
                  <option value="">Select Action</option>
                  <option value="approved">Approve</option>
                  <option value="hidden">Hide</option>
                  <option value="deleted">Delete</option>
                </select>
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  className="form-control"
                />
                <button 
                  onClick={bulkModerateMessages}
                  className="btn btn-primary"
                >
                  Apply to {selectedMessages.length} messages
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedMessages.length === messages.length && messages.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Sender</th>
              <th>Receiver</th>
              <th>Content</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center">Loading...</td>
              </tr>
            ) : messages.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">No messages found</td>
              </tr>
            ) : (
              messages.map(message => (
                <tr key={message._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedMessages.includes(message._id)}
                      onChange={() => handleMessageSelect(message._id)}
                    />
                  </td>
                  <td>
                    <div className="user-info">
                      <img 
                        src={message.sender?.profileImage || '/default-avatar.png'} 
                        alt={message.sender?.name || 'Unknown'}
                        className="user-avatar-small"
                      />
                      <span>{message.sender?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-info">
                      <img 
                        src={message.receiver?.profileImage || '/default-avatar.png'} 
                        alt={message.receiver?.name || 'Unknown'}
                        className="user-avatar-small"
                      />
                      <span>{message.receiver?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="message-content-preview">
                      {message.content.length > 100 ? 
                        message.content.substring(0, 100) + '...' : 
                        message.content
                      }
                    </div>
                  </td>
                  <td>{formatDate(message.createdAt)}</td>
                  <td>
                    <div className="message-status">
                      {message.isReported && <span className="badge bg-warning">Reported</span>}
                      {message.isModerated && <span className="badge bg-info">Moderated</span>}
                      {message.isDeleted && <span className="badge bg-danger">Deleted</span>}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => viewMessageDetails(message)}
                        className="btn btn-sm btn-outline-primary"
                        title="View Details"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        onClick={() => deleteMessage(message._id)}
                        className="btn btn-sm btn-outline-danger"
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <nav>
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );

  // Render conversations tab
  const renderConversations = () => (
    <div className="admin-conversations">
      <div className="row mb-3">
        <div className="col-md-6">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Users</th>
              <th>Messages</th>
              <th>Reported</th>
              <th>Moderated</th>
              <th>Last Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center">Loading...</td>
              </tr>
            ) : conversations.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">No conversations found</td>
              </tr>
            ) : (
              conversations.map(conversation => (
                <tr key={conversation._id}>
                  <td>
                    <div className="conversation-users">
                      <div className="user-info">
                        <img 
                          src={conversation.senderInfo?.[0]?.profileImage || '/default-avatar.png'} 
                          alt={conversation.senderInfo?.[0]?.name || 'Unknown'}
                          className="user-avatar-small"
                        />
                        <span>{conversation.senderInfo?.[0]?.name || 'Unknown'}</span>
                      </div>
                      <i className="fas fa-exchange-alt"></i>
                      <div className="user-info">
                        <img 
                          src={conversation.receiverInfo?.[0]?.profileImage || '/default-avatar.png'} 
                          alt={conversation.receiverInfo?.[0]?.name || 'Unknown'}
                          className="user-avatar-small"
                        />
                        <span>{conversation.receiverInfo?.[0]?.name || 'Unknown'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-primary">{conversation.messageCount}</span>
                  </td>
                  <td>
                    {conversation.reportedCount > 0 && (
                      <span className="badge bg-warning">{conversation.reportedCount}</span>
                    )}
                  </td>
                  <td>
                    {conversation.moderatedCount > 0 && (
                      <span className="badge bg-info">{conversation.moderatedCount}</span>
                    )}
                  </td>
                  <td>{formatDate(conversation.lastMessage?.createdAt)}</td>
                  <td>
                    <button
                      onClick={() => {
                        setActiveTab('messages');
                        setStatusFilter('all');
                        setSearchTerm('');
                      }}
                      className="btn btn-sm btn-outline-primary"
                      title="View Messages"
                    >
                      <i className="fas fa-comments"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="admin-messages-container">
      <div className="admin-header">
        <h2>Message Management</h2>
        <p>Monitor and moderate user messages</p>
      </div>

      <div className="admin-tabs">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              All Messages
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'reported' ? 'active' : ''}`}
              onClick={() => setActiveTab('reported')}
            >
              Reported Messages
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'conversations' ? 'active' : ''}`}
              onClick={() => setActiveTab('conversations')}
            >
              Conversations
            </button>
          </li>
        </ul>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'messages' && renderMessages()}
        {activeTab === 'reported' && renderMessages()}
        {activeTab === 'conversations' && renderConversations()}
      </div>

      {/* Message Details Modal */}
      {showModal && modalMessage && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Message Details</h3>
              <button onClick={() => setShowModal(false)} className="btn-close">×</button>
            </div>
            <div className="modal-body">
              <div className="message-details">
                <div className="detail-row">
                  <strong>Sender:</strong> {modalMessage.sender?.name || 'Unknown'}
                </div>
                <div className="detail-row">
                  <strong>Receiver:</strong> {modalMessage.receiver?.name || 'Unknown'}
                </div>
                <div className="detail-row">
                  <strong>Content:</strong> {modalMessage.content}
                </div>
                <div className="detail-row">
                  <strong>Type:</strong> {modalMessage.messageType}
                </div>
                <div className="detail-row">
                  <strong>Created:</strong> {formatDate(modalMessage.createdAt)}
                </div>
                {modalMessage.isReported && (
                  <>
                    <div className="detail-row">
                      <strong>Reported by:</strong> {modalMessage.reportedBy?.name || 'Unknown'}
                    </div>
                    <div className="detail-row">
                      <strong>Report reason:</strong> {modalMessage.reportReason}
                    </div>
                  </>
                )}
                {modalMessage.isModerated && (
                  <>
                    <div className="detail-row">
                      <strong>Moderated by:</strong> {modalMessage.moderatedBy?.name || 'Unknown'}
                    </div>
                    <div className="detail-row">
                      <strong>Moderation action:</strong> {modalMessage.moderationAction}
                    </div>
                    <div className="detail-row">
                      <strong>Moderation reason:</strong> {modalMessage.moderationReason}
                    </div>
                  </>
                )}
              </div>
              
              {!modalMessage.isModerated && (
                <div className="moderation-section">
                  <h4>Moderate Message</h4>
                  <div className="row">
                    <div className="col-md-6">
                      <select 
                        value={moderationAction} 
                        onChange={(e) => setModerationAction(e.target.value)}
                        className="form-select"
                      >
                        <option value="">Select Action</option>
                        <option value="approved">Approve</option>
                        <option value="hidden">Hide</option>
                        <option value="deleted">Delete</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <input
                        type="text"
                        placeholder="Reason (optional)"
                        value={moderationReason}
                        onChange={(e) => setModerationReason(e.target.value)}
                        className="form-control"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => moderateMessage(modalMessage._id, moderationAction, moderationReason)}
                    className="btn btn-primary mt-2"
                    disabled={!moderationAction}
                  >
                    Apply Moderation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages; 